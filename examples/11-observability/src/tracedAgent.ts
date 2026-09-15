import type { LLMConfig } from "./config.ts";
import type { ChatMessage, LLMProvider, ToolSchema } from "./provider.ts";
import { timed, trace } from "./tracer.ts";

export interface Tool {
  schema: ToolSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<string>;
}

const MAX_ITERATIONS = 8;
const TOOL_TIMEOUT_MS = 10_000;

export async function runTracedAgent(
  provider: LLMProvider,
  config: LLMConfig,
  tools: Tool[],
  systemPrompt: string,
  task: string,
): Promise<string> {
  const toolsByName = new Map(tools.map((tool) => [tool.schema.name, tool]));
  const schemas = tools.map((tool) => tool.schema);
  const runStart = performance.now();

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  let iteration = 0;
  for (; iteration < MAX_ITERATIONS; iteration++) {
    const { result: response, durationMs: llmDuration } = await timed(() =>
      provider.chat({ messages, tools: schemas }),
    );
    trace({ type: "llm_call", model: config.model, durationMs: llmDuration });

    const toolCall = response.message.toolCalls?.[0];
    if (!toolCall) {
      trace({
        type: "run_end",
        iterations: iteration + 1,
        durationMs: Math.round(performance.now() - runStart),
      });
      return response.message.content;
    }

    messages.push(response.message);

    const tool = toolsByName.get(toolCall.name);
    const { result, durationMs: toolDuration } = await timed(async () => {
      if (!tool) return `Unknown tool: ${toolCall.name}`;
      return runWithTimeout(tool.run(toolCall.arguments), TOOL_TIMEOUT_MS);
    });

    trace({
      type: "tool_call",
      name: toolCall.name,
      args: toolCall.arguments,
      durationMs: toolDuration,
      ok: !!tool,
    });
    messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
  }

  trace({
    type: "run_end",
    iterations: iteration,
    durationMs: Math.round(performance.now() - runStart),
  });
  return `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`;
}

async function runWithTimeout(
  promise: Promise<string>,
  timeoutMs: number,
): Promise<string> {
  const timeout = new Promise<string>((resolve) =>
    setTimeout(() => resolve(`Tool timed out after ${timeoutMs}ms`), timeoutMs),
  );

  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    return `Tool failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}
