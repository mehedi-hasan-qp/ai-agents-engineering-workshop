import { appendFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import type { ChatMessage } from "llm-provider/provider";

const SESSION_DIR = path.resolve(import.meta.dirname, "../.session");
const SESSION_FILE = path.join(SESSION_DIR, "transcript.jsonl");

// One JSON object per line, appended as the run goes and never rewritten.
// Claude Code, Codex and pi all persist sessions in some variant of this
// format, for the same three reasons: you can resume after a crash, you can
// replay a run to debug it, and appending is cheap and cannot corrupt what
// was already written.
//
// Compaction is an entry too, not an overwrite. The full history stays on
// disk for debugging; the compaction entry tells a resume where the live
// context restarts.
type SessionEntry =
  | { type: "message"; message: ChatMessage }
  | { type: "compaction"; context: ChatMessage[] };

// A fresh run starts a fresh log; a resumed run keeps appending to the old one.
export async function startSession(messages: ChatMessage[]): Promise<void> {
  await rm(SESSION_FILE, { force: true });
  for (const message of messages) await appendMessage(message);
}

export async function appendMessage(message: ChatMessage): Promise<void> {
  await append({ type: "message", message });
}

export async function appendCompaction(context: ChatMessage[]): Promise<void> {
  await append({ type: "compaction", context });
}

async function append(entry: SessionEntry): Promise<void> {
  await mkdir(SESSION_DIR, { recursive: true });
  await appendFile(SESSION_FILE, `${JSON.stringify(entry)}\n`, "utf-8");
}

// Replays the log: messages accumulate, a compaction replaces everything
// before it with the compacted context.
export async function loadSession(): Promise<ChatMessage[] | undefined> {
  let raw: string;
  try {
    raw = await readFile(SESSION_FILE, "utf-8");
  } catch {
    return undefined;
  }

  let context: ChatMessage[] = [];
  for (const line of raw.split("\n")) {
    if (!line) continue;
    let entry: SessionEntry;
    try {
      entry = JSON.parse(line) as SessionEntry;
    } catch {
      // A crash mid-write leaves at most one torn last line. Skip it.
      continue;
    }
    if (entry.type === "message") context.push(entry.message);
    else context = [...entry.context];
  }

  context = dropUnansweredCalls(context);
  return context.length > 0 ? context : undefined;
}

// Ctrl-C between a tool call and its result leaves a call with no answer.
// Sending that back is an orphan the provider rejects, so drop the call and
// let the resumed run ask the model again.
function dropUnansweredCalls(context: ChatMessage[]): ChatMessage[] {
  for (let i = context.length - 1; i >= 0; i--) {
    const message = context[i];
    if (message?.role !== "assistant" || !message.toolCalls?.length) continue;

    const answered = context.slice(i + 1).filter((next) => next.role === "tool").length;
    return answered < message.toolCalls.length ? context.slice(0, i) : context;
  }
  return context;
}

export const sessionPath = SESSION_FILE;
