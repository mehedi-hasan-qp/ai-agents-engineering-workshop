import { loadConfig } from "./config.ts";
import { OpenAICompatibleProvider } from "./provider.ts";
import { spawnAgent } from "./spawnAgent.ts";
import { readFileSchema, readFileTool, searchCode, searchCodeSchema } from "./tools.ts";

const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

// The main agent delegates the investigation to a research sub-agent with
// only read-only tools - it never sees the parent's conversation, and the
// parent never sees its intermediate tool calls, only the final result.
const researchResult = await spawnAgent(provider, {
  task: "Find the source of the whitespace bug in getPokemonByName and quote the exact line.",
  tools: [
    { schema: searchCodeSchema, run: searchCode },
    { schema: readFileSchema, run: readFileTool },
  ],
});

console.log("Sub-agent result:");
console.log(researchResult);
