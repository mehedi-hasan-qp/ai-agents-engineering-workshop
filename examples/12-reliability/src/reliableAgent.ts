import type { ChatMessage, LLMProvider, ToolSchema } from "llm-provider/provider";
import { ToolError } from "./flakyTools.ts";

export interface Tool {
  schema: ToolSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<string>;
}

const MAX_ITERATIONS = 8;
const TOOL_TIMEOUT_MS = 5_000;

// A structured tool result, always. The model gets the same shape whether
// the tool succeeded or failed, so it can decide what to do next instead of
// choking on an unexpected format.
interface ToolOutcome {
  ok: boolean;
  result?: string;
  error?: string;
  // Can calling it again help? Unknown errors default to false: repeating a
  // "file not found" just burns the budget.
  retryable?: boolean;
}

// This is the SEMANTIC retry from session 2. The harness does not retry
// tools behind the model's back - it hands the failure to the model, and the
// model decides: try again, or take another route.
//
// Why not retry here, like the provider retries a 429? Because a tool call is
// not always safe to repeat. A timed-out edit_file or run_tests may still be
// running; repeating it can apply the change twice. The provider only
// retries a request that is safe to repeat. A harness that auto-retries tools
// has to know which ones are idempotent - and it rarely knows better than the
// model reading the error.
export async function runReliableAgent(
  provider: LLMProvider,
  tools: Tool[],
  systemPrompt: string,
  task: string,
): Promise<string> {
  const toolsByName = new Map(tools.map((tool) => [tool.schema.name, tool]));
  const schemas = tools.map((tool) => tool.schema);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await provider.chat({ messages, tools: schemas });
    const toolCalls = response.message.toolCalls ?? [];

    if (toolCalls.length === 0) {
      return response.message.content;
    }

    messages.push(response.message);

    for (const toolCall of toolCalls) {
      const tool = toolsByName.get(toolCall.name);
      const outcome: ToolOutcome = tool
        ? await runOnce(tool, toolCall.arguments)
        : { ok: false, error: `Unknown tool: ${toolCall.name}`, retryable: false };

      console.log(
        `  ${toolCall.name}(${JSON.stringify(toolCall.arguments)}) -> ` +
          (outcome.ok ? "ok" : `ok:false  ${outcome.error} (retryable: ${outcome.retryable})`),
      );

      messages.push({
        role: "tool",
        content: JSON.stringify(outcome),
        toolCallId: toolCall.id,
      });
    }
  }

  return `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`;
}

async function runOnce(tool: Tool, args: unknown): Promise<ToolOutcome> {
  try {
    return { ok: true, result: await runWithTimeout(tool.run(args), TOOL_TIMEOUT_MS) };
  } catch (error) {
    if (error instanceof ToolError) {
      return { ok: false, error: error.message, retryable: error.retryable };
    }
    if (error instanceof TimeoutError) {
      return { ok: false, error: error.message, retryable: true };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      retryable: false,
    };
  }
}

class TimeoutError extends Error {}

async function runWithTimeout(promise: Promise<string>, timeoutMs: number): Promise<string> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<string>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
