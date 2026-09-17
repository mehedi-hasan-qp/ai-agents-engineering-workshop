import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChatMessage } from "llm-provider/provider";

const SESSION_DIR = path.resolve(import.meta.dirname, "../.session");
const SESSION_FILE = path.join(SESSION_DIR, "transcript.jsonl");

// One JSON object per line, appended as the run goes. Claude Code, Codex and
// pi all persist sessions in some variant of this format, for the same three
// reasons: you can resume after a crash, you can replay a run to debug it,
// and you can append without rewriting the whole file.
export async function saveSession(messages: ChatMessage[]): Promise<void> {
  await mkdir(SESSION_DIR, { recursive: true });
  const lines = messages.map((message) => JSON.stringify(message)).join("\n");
  await writeFile(SESSION_FILE, `${lines}\n`, "utf-8");
}

export async function loadSession(): Promise<ChatMessage[] | undefined> {
  try {
    const raw = await readFile(SESSION_FILE, "utf-8");
    const messages = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ChatMessage);
    return messages.length > 0 ? messages : undefined;
  } catch {
    return undefined;
  }
}

export const sessionPath = SESSION_FILE;
