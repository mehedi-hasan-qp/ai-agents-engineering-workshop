import type { ChatMessage, LLMProvider, ToolSchema } from "./provider.ts";

export interface Tool {
  schema: ToolSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<string>;
}

const MAX_ITERATIONS = 8;
const TOOL_TIMEOUT_MS = 5_000;
const MAX_RETRIES = 2;

// A structured tool result, always. The model gets the same shape whether
// the tool succeeded or failed, so it can decide what to do next instead of
// choking on an unexpected format.
interface ToolOutcome {
  ok: boolean;
  result?: string;
  error?: string;
}

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
    const toolCall = response.message.toolCalls?.[0];

    if (!toolCall) {
      return response.message.content;
    }

    messages.push(response.message);

    const tool = toolsByName.get(toolCall.name);
    const outcome = tool
      ? await runWithRetries(tool, toolCall.arguments)
      : { ok: false, error: `Unknown tool: ${toolCall.name}` };

    messages.push({
      role: "tool",
      content: JSON.stringify(outcome),
      toolCallId: toolCall.id,
    });
  }

  return `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`;
}

async function runWithRetries(tool: Tool, args: unknown): Promise<ToolOutcome> {
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await runWithTimeout(tool.run(args), TOOL_TIMEOUT_MS);
      return { ok: true, result };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    ok: false,
    error: `Failed after ${MAX_RETRIES + 1} attempts: ${lastError}`,
  };
}

async function runWithTimeout(promise: Promise<string>, timeoutMs: number): Promise<string> {
  const timeout = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([promise, timeout]);
}
