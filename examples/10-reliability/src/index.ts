import { loadConfig } from "./config.ts";
import { flakySearchCode, flakySearchCodeSchema } from "./flakyTools.ts";
import { OpenAICompatibleProvider } from "./provider.ts";
import { runReliableAgent, type Tool } from "./reliableAgent.ts";
import { readFileSchema, readFileTool, runTests, runTestsSchema } from "./tools.ts";

const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const tools: Tool[] = [
  { schema: flakySearchCodeSchema, run: flakySearchCode },
  { schema: readFileSchema, run: readFileTool },
  { schema: runTestsSchema, run: runTests },
];

const systemPrompt =
  "You are an engineering agent. Tool results are JSON with an `ok` field - " +
  "if ok is false, read the `error` and decide whether to retry or try something else. " +
  "Investigate why the Pokédex API test suite is failing.";

const answer = await runReliableAgent(
  provider,
  tools,
  systemPrompt,
  "Why is the Pokédex API test suite failing?",
);
console.log(answer);
