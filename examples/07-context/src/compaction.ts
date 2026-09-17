import type { ChatMessage, LLMProvider } from "llm-provider/provider";

// Deliberately tiny so compaction fires within one short workshop run. A real
// harness sets this from the model's context window, usually triggering
// somewhere around 70-80% full.
export const COMPACT_THRESHOLD_CHARS = 6_000;

// Rough enough. Real harnesses read `usage.prompt_tokens` off the API response
// instead of estimating, but the mechanic is identical: measure the context,
// compare against a threshold, act before the wall.
export function estimateTokens(messages: ChatMessage[]): number {
  return Math.round(contextSize(messages) / 4);
}

export function contextSize(messages: ChatMessage[]): number {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

/**
 * Truncation throws away the tail. Compaction *summarises* it and keeps going.
 *
 * The split matters: the system prompt and the original task stay verbatim
 * (lose those and the agent forgets what it was doing), the oldest middle
 * turns get replaced by a summary the model writes itself, and the most recent
 * turns survive intact because that is where the live work is.
 *
 *   [system] [task] [....... summarised .......] [recent turns kept verbatim]
 */
export async function compact(
  provider: LLMProvider,
  messages: ChatMessage[],
  keepRecent = 4,
): Promise<ChatMessage[]> {
  const system = messages[0];
  const task = messages[1];
  if (!system || !task) return messages;

  const middle = messages.slice(2, Math.max(2, messages.length - keepRecent));
  const recent = messages.slice(Math.max(2, messages.length - keepRecent));
  if (middle.length === 0) return messages;

  const transcript = middle
    .map((message) => `${message.role}: ${message.content.slice(0, 600)}`)
    .join("\n");

  const summary = await provider.chat({
    messages: [
      {
        role: "system",
        content:
          "Summarise this agent transcript for your own future reference. " +
          "Keep: files inspected, what was found in them, what has been ruled " +
          "out, and what remains to be done. Drop: raw file contents and tool " +
          "chatter. Be specific about file paths and function names.",
      },
      { role: "user", content: transcript },
    ],
  });

  // A tool result must always follow its tool call. Dropping the middle can
  // orphan one, and most providers reject the request outright if it does.
  const safeRecent = recent[0]?.role === "tool" ? recent.slice(1) : recent;

  return [
    system,
    task,
    { role: "assistant", content: `[summary of earlier work]\n${summary.message.content}` },
    ...safeRecent,
  ];
}
