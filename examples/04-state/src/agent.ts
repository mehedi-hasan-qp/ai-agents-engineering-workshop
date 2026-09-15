import type { ChatMessage, LLMProvider, ToolSchema } from "./provider.ts";

export interface Tool {
  schema: ToolSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any) => Promise<string>;
}

// Agent state that never goes into the prompt: it's bookkeeping the runtime
// needs, not something the model reasons about. Compare with `messages`
// below, which IS the model's context and costs tokens on every call.
export interface AgentState {
  iterations: number;
  toolCallsByName: Record<string, number>;
}

const MAX_ITERATIONS = 8;
const TOOL_TIMEOUT_MS = 10_000;

// Tool output past this size is truncated before it ever reaches the model.
// Without this, one large file read can dominate the context window and
// crowd out everything else the agent needs to reason about.
const MAX_TOOL_RESULT_CHARS = 800;

export async function runAgent(
  provider: LLMProvider,
  tools: Tool[],
  systemPrompt: string,
  task: string,
): Promise<{ answer: string; state: AgentState }> {
  const toolsByName = new Map(tools.map((tool) => [tool.schema.name, tool]));
  const schemas = tools.map((tool) => tool.schema);

  // Conversation history: this is the model's entire view of the world.
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  // Agent state: lives outside the context, never sent to the model.
  const state: AgentState = { iterations: 0, toolCallsByName: {} };

  for (; state.iterations < MAX_ITERATIONS; state.iterations++) {
    const response = await provider.chat({ messages, tools: schemas });
    const toolCall = response.message.toolCalls?.[0];

    if (!toolCall) {
      return { answer: response.message.content, state };
    }

    messages.push(response.message);
    state.toolCallsByName[toolCall.name] =
      (state.toolCallsByName[toolCall.name] ?? 0) + 1;

    const tool = toolsByName.get(toolCall.name);
    const rawResult = tool
      ? await runWithTimeout(tool.run(toolCall.arguments), TOOL_TIMEOUT_MS)
      : `Unknown tool: ${toolCall.name}`;

    const result = truncate(rawResult);
    messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
  }

  return {
    answer: `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`,
    state,
  };
}

function truncate(result: string): string {
  if (result.length <= MAX_TOOL_RESULT_CHARS) return result;
  const omitted = result.length - MAX_TOOL_RESULT_CHARS;
  return `${result.slice(0, MAX_TOOL_RESULT_CHARS)}\n... [truncated ${omitted} more characters]`;
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
