import { loadConfig } from "llm-provider/config";
import { OpenAICompatibleProvider } from "llm-provider/provider";
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
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const [research, review] = await Promise.all([
  spawnAgent(provider, {
    task: "Search the codebase and report which function contains the whitespace bug.",
    tools: [
      { schema: searchCodeSchema, run: searchCode },
      { schema: readFileSchema, run: readFileTool },
    ],
  }),
  spawnAgent(provider, {
    task: "Run the test suite and report which test is failing and its error message.",
    tools: [
      { schema: runTestsSchema, run: runTests },
      { schema: listFilesSchema, run: listFiles },
    ],
  }),
]);

console.log("Research agent:", research);
console.log("Review agent:", review);
