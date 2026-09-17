import { loadConfig } from "llm-provider/config";
import { type ChatMessage, OpenAICompatibleProvider } from "llm-provider/provider";
import { runAgent } from "./agent.ts";
import { loadMemory, remember, rememberSchema } from "./memory.ts";
import { ToolRegistry } from "./registry.ts";
import { loadSession, sessionPath } from "./session.ts";
import {
  listFiles,
  listFilesSchema,
  readFileSchema,
  readFileTool,
  runTests,
  runTestsSchema,
  searchCode,
  searchCodeSchema,
} from "./tools.ts";

const provider = new OpenAICompatibleProvider(loadConfig());

const registry = new ToolRegistry();
registry.register({ schema: searchCodeSchema, kind: "read", run: searchCode });
registry.register({ schema: readFileSchema, kind: "read", run: readFileTool });
registry.register({ schema: listFilesSchema, kind: "read", run: listFiles });
registry.register({ schema: runTestsSchema, kind: "execute", run: runTests });
registry.register({ schema: rememberSchema, kind: "write", run: remember });

const resuming = process.argv.includes("--resume");
const memory = await loadMemory();

// Three layers, in priority order, all of them just strings we chose to
// concatenate. Nothing about this is magic: "memory" is a file, and the model
// cannot tell the difference between a fact we loaded from disk and a fact we
// typed here.
const systemPrompt = [
  "You are an engineering agent investigating a small TypeScript project.",
  "Use the tools to find and explain the cause of any failing test.",
  "If you learn something durable about how this project works, call remember.",
  memory ? `\n--- project memory (AGENTS.md) ---\n${memory}` : "",
].join(" ");

const task = "Read every source file in the project, then explain why the test suite is failing.";

const fresh: ChatMessage[] = [
  { role: "system", content: systemPrompt },
  { role: "user", content: task },
];

const restored = resuming ? await loadSession() : undefined;
if (resuming) {
  console.log(
    restored
      ? `Resumed ${restored.length} messages from ${sessionPath}\n`
      : `No saved session at ${sessionPath}, starting fresh.\n`,
  );
}

const { answer, state } = await runAgent(provider, registry, restored ?? fresh);

console.log(`\n${answer}`);
console.log("\n--- context report ---");
console.log(`iterations:   ${state.iterations}`);
console.log(`tool calls:   ${JSON.stringify(state.toolCallsByName)}`);
console.log(`compactions:  ${state.compactions}`);
console.log(`peak context: ~${state.peakTokens} tokens`);
console.log(`\nSession saved to ${sessionPath}`);
console.log("Resume it with:  pnpm 07:resume");
