import type { ChatMessage, LLMProvider, ToolSchema } from "llm-provider/provider";

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
  // Prompt tokens billed per call, as reported by the provider. Watch it grow:
  // every call re-sends the whole history.
  promptTokensPerCall: number[];
  completionTokens: number;
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
  const state: AgentState = {
    iterations: 0,
    toolCallsByName: {},
    promptTokensPerCall: [],
    completionTokens: 0,
  };

  for (; state.iterations < MAX_ITERATIONS; state.iterations++) {
    const response = await provider.chat({ messages, tools: schemas });
    state.promptTokensPerCall.push(response.usage?.promptTokens ?? 0);
    state.completionTokens += response.usage?.completionTokens ?? 0;

    const toolCalls = response.message.toolCalls ?? [];
    if (toolCalls.length === 0) {
      return { answer: finalAnswer(response.message.content, response.finishReason), state };
    }

    messages.push(response.message);

    for (const toolCall of toolCalls) {
      state.toolCallsByName[toolCall.name] = (state.toolCallsByName[toolCall.name] ?? 0) + 1;

      const tool = toolsByName.get(toolCall.name);
      const rawResult = tool
        ? await runWithTimeout(tool.run(toolCall.arguments), TOOL_TIMEOUT_MS)
        : `Unknown tool: ${toolCall.name}`;

      const result = truncate(rawResult);
      const lost = rawResult.length - MAX_TOOL_RESULT_CHARS;
      console.log(
        `  ${toolCall.name}(${JSON.stringify(toolCall.arguments)}) -> ${rawResult.length} chars` +
          (lost > 0 ? `, TRUNCATED: the model never sees the last ${lost}` : ""),
      );

      messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
    }
  }

  return {
    answer: `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`,
    state,
  };
}

function finalAnswer(content: string, finishReason: string | undefined): string {
  return finishReason === "length" ? `${content}\n[cut off: output token limit reached]` : content;
}

function truncate(result: string): string {
  if (result.length <= MAX_TOOL_RESULT_CHARS) return result;
  const omitted = result.length - MAX_TOOL_RESULT_CHARS;
  return `${result.slice(0, MAX_TOOL_RESULT_CHARS)}\n... [truncated ${omitted} more characters]`;
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
