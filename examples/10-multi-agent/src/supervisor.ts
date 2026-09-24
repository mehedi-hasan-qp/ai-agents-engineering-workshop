import { loadConfig } from "llm-provider/config";
import { OpenAICompatibleProvider } from "llm-provider/provider";
import { runAgent } from "./agent.ts";
import { spawnAgent } from "./spawnAgent.ts";
import {
  listFilesSchema,
  listFiles,
  readFileSchema,
  readFileTool,
  runTests,
  runTestsSchema,
  searchCode,
  searchCodeSchema,
} from "./tools.ts";

// A supervisor delegates each branch of the work to a specialist sub-agent
// and combines their results itself. The sub-agents never talk to each
// other - all coordination flows through the supervisor.
//
// The branches here are fixed in code to keep the pattern visible. Example 09
// shows the model-driven version, where the supervisor decides to delegate
// through a tool call - which is how Claude Code does it.
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const [tests, source] = await Promise.all([
  spawnAgent(provider, {
    task: "Run the test suite and report which test is failing and its exact error message.",
    tools: [
      { schema: runTestsSchema, run: runTests },
      { schema: listFilesSchema, run: listFiles },
    ],
  }),
  spawnAgent(provider, {
    task: "Read the Pokédex API source and describe how name lookups work, quoting the code.",
    tools: [
      { schema: searchCodeSchema, run: searchCode },
      { schema: readFileSchema, run: readFileTool },
    ],
  }),
]);

console.log("Test agent:", tests);
console.log("\nSource agent:", source);

// Neither specialist alone knows the answer: one has the symptom, the other
// has the code. The supervisor is the only place both reports meet.
const verdict = await runAgent(
  provider,
  [],
  "You are the supervising engineer. Combine your specialists' reports into one " +
    "diagnosis: the root cause, and the one line to change.",
  `Test agent report:\n${tests}\n\nSource agent report:\n${source}`,
);

console.log("\nSupervisor:", verdict);
