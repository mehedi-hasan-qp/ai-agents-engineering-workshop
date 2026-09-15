import type { ChatMessage, LLMProvider, ToolSchema } from "./provider.ts";

export interface Tool {
  schema: ToolSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<string>;
}

const MAX_ITERATIONS = 8;
const TOOL_TIMEOUT_MS = 10_000;

// The agent loop: ask the model, execute what it asks for, feed the result
// back, repeat - until it stops requesting tools or we hit a safeguard.
export async function runAgent(
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
    const result = tool
      ? await runWithTimeout(tool.run(toolCall.arguments), TOOL_TIMEOUT_MS)
      : `Unknown tool: ${toolCall.name}`;

    messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
  }

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
