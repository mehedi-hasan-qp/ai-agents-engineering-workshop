import type { ChatMessage, LLMProvider, ToolSchema } from "llm-provider/provider";

export interface Tool {
  schema: ToolSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<string>;
}

export interface AgentRun {
  answer: string;
  toolsCalled: string[];
  iterations: number;
  // Did the model stop on its own with an answer? Iteration count can't tell:
  // answering on the last allowed call and being cut off look the same.
  finished: boolean;
}

const TOOL_TIMEOUT_MS = 10_000;

// Same loop as Example 03, but it returns the full trajectory - not just
// the final answer - because evaluation cares about *how* the agent got
// there, not only what it said at the end.
export async function runAgent(
  provider: LLMProvider,
  tools: Tool[],
  systemPrompt: string,
  task: string,
  maxIterations: number,
): Promise<AgentRun> {
  const toolsByName = new Map(tools.map((tool) => [tool.schema.name, tool]));
  const schemas = tools.map((tool) => tool.schema);
  const toolsCalled: string[] = [];

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  let iteration = 0;
  for (; iteration < maxIterations; iteration++) {
    const response = await provider.chat({ messages, tools: schemas });
    const toolCalls = response.message.toolCalls ?? [];

    if (toolCalls.length === 0) {
      return {
        answer: response.message.content,
        toolsCalled,
        iterations: iteration + 1,
        finished: response.finishReason !== "length",
      };
    }

    messages.push(response.message);

    for (const toolCall of toolCalls) {
      toolsCalled.push(toolCall.name);

      const tool = toolsByName.get(toolCall.name);
      const result = tool
        ? await runWithTimeout(tool.run(toolCall.arguments), TOOL_TIMEOUT_MS)
        : `Unknown tool: ${toolCall.name}`;

      messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
    }
  }

  return {
    answer: "Gave up without a final answer.",
    toolsCalled,
    iterations: iteration,
    finished: false,
  };
}

async function runWithTimeout(promise: Promise<string>, timeoutMs: number): Promise<string> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<string>((resolve) => {
    timer = setTimeout(() => resolve(`Tool timed out after ${timeoutMs}ms`), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    return `Tool failed: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    clearTimeout(timer);
  }
}
