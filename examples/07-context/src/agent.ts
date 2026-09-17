import type { ChatMessage, LLMProvider } from "llm-provider/provider";
import { COMPACT_THRESHOLD_CHARS, compact, contextSize, estimateTokens } from "./compaction.ts";
import type { ToolRegistry } from "./registry.ts";
import { saveSession } from "./session.ts";

const MAX_ITERATIONS = 12;
const TOOL_TIMEOUT_MS = 60_000;

// Note what is NOT here: a truncation limit on tool results. Example 04
// truncated every tool result to 800 characters so the context could never
// grow. That works until the one detail the agent needed was in the part you
// cut. Here full results go in, the context is allowed to grow, and the
// harness compacts when it gets close to the limit instead.
export interface AgentState {
  iterations: number;
  toolCallsByName: Record<string, number>;
  compactions: number;
  peakTokens: number;
}

export async function runAgent(
  provider: LLMProvider,
  registry: ToolRegistry,
  messages: ChatMessage[],
): Promise<{ answer: string; state: AgentState; messages: ChatMessage[] }> {
  const state: AgentState = {
    iterations: 0,
    toolCallsByName: {},
    compactions: 0,
    peakTokens: 0,
  };

  let context = messages;

  for (; state.iterations < MAX_ITERATIONS; state.iterations++) {
    state.peakTokens = Math.max(state.peakTokens, estimateTokens(context));

    if (contextSize(context) > COMPACT_THRESHOLD_CHARS) {
      const before = estimateTokens(context);
      context = await compact(provider, context);
      state.compactions++;
      console.log(
        `  [compacted ${before} -> ${estimateTokens(context)} tokens, ` +
          `${context.length} messages remain]`,
      );
    }

    const response = await provider.chat({ messages: context, tools: registry.schemas() });
    const toolCall = response.message.toolCalls?.[0];

    if (!toolCall) {
      context.push(response.message);
      await saveSession(context);
      return { answer: response.message.content, state, messages: context };
    }

    context.push(response.message);
    state.toolCallsByName[toolCall.name] = (state.toolCallsByName[toolCall.name] ?? 0) + 1;

    const tool = registry.get(toolCall.name);
    const result = tool
      ? await runWithTimeout(tool.run(toolCall.arguments), TOOL_TIMEOUT_MS)
      : `Unknown tool: ${toolCall.name}`;

    console.log(`  ${toolCall.name} -> ${result.length} chars`);
    context.push({ role: "tool", content: result, toolCallId: toolCall.id });

    // Persist after every turn, not at the end. A session you can only resume
    // when the process exited cleanly is a session you cannot resume.
    await saveSession(context);
  }

  return { answer: `Gave up after ${MAX_ITERATIONS} iterations.`, state, messages: context };
}

async function runWithTimeout(promise: Promise<string>, timeoutMs: number): Promise<string> {
  const timeout = new Promise<string>((resolve) =>
    setTimeout(() => resolve(`Tool timed out after ${timeoutMs}ms`), timeoutMs),
  );

  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    return `Tool failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}
