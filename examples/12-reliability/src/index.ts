import { loadConfig } from "llm-provider/config";
import { brokenSearchCode, brokenSearchCodeSchema } from "./flakyTools.ts";
import { OpenAICompatibleProvider } from "llm-provider/provider";
import { runReliableAgent, type Tool } from "./reliableAgent.ts";
import {
  listFiles,
  listFilesSchema,
  readFileSchema,
  readFileTool,
  runTests,
  runTestsSchema,
} from "./tools.ts";

const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

// search_code is down for this whole run. Watch the trace: the model gets
// `ok: false, retryable: false`, stops asking for search, and finds the code
// another way.
const tools: Tool[] = [
  { schema: brokenSearchCodeSchema, run: brokenSearchCode },
  { schema: listFilesSchema, run: listFiles },
  { schema: readFileSchema, run: readFileTool },
  { schema: runTestsSchema, run: runTests },
];

const systemPrompt =
  "You are an engineering agent. Tool results are JSON with an `ok` field. " +
  "If ok is false, read `error`: when `retryable` is true you may try the same call " +
  "again, otherwise do not repeat it - find another way to get what you needed.";

const answer = await runReliableAgent(
  provider,
  tools,
  systemPrompt,
  "Why is the Pokédex API test suite failing? Start by searching the code for getPokemonByName.",
);
console.log(`\n${answer}`);
