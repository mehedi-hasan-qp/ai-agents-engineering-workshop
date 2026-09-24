import { runAgent, type Tool } from "./agent.ts";
import { loadConfig } from "llm-provider/config";
import { OpenAICompatibleProvider } from "llm-provider/provider";
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

const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const tools: Tool[] = [
  { schema: searchCodeSchema, run: searchCode },
  { schema: readFileSchema, run: readFileTool },
  { schema: listFilesSchema, run: listFiles },
  { schema: runTestsSchema, run: runTests },
];

const systemPrompt =
  "You are an engineering agent investigating a small TypeScript project. " +
  "Use the available tools to find and explain the cause of any failing test.";

const { answer, state } = await runAgent(
  provider,
  tools,
  systemPrompt,
  "Why is the Pokédex API test suite failing?",
);

console.log(answer);
console.log("\n--- agent state (never sent to the model) ---");
console.log(`iterations: ${state.iterations}`);
console.log(`tool calls: ${JSON.stringify(state.toolCallsByName)}`);

// Each call re-sends everything before it, so the total is far bigger than
// the final context. That gap is the bill.
const totalPrompt = state.promptTokensPerCall.reduce((sum, tokens) => sum + tokens, 0);
console.log(`prompt tokens per call: ${state.promptTokensPerCall.join(" -> ")}`);
console.log(`total billed: ${totalPrompt} prompt + ${state.completionTokens} completion tokens`);
console.log(`final context was only ${state.promptTokensPerCall.at(-1) ?? 0} of those`);
