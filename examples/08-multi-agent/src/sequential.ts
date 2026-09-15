import { loadConfig } from "./config.ts";
import { OpenAICompatibleProvider } from "./provider.ts";
import { spawnAgent } from "./spawnAgent.ts";
import {
  readFileSchema,
  readFileTool,
  searchCode,
  searchCodeSchema,
} from "./tools.ts";

// Each stage's output becomes the next stage's input. No parallelism, no
// shared state beyond what's explicitly passed forward.
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const research = await spawnAgent(provider, {
  task: "Find the line of code causing the whitespace bug in getPokemonByName.",
  tools: [
    { schema: searchCodeSchema, run: searchCode },
    { schema: readFileSchema, run: readFileTool },
  ],
});

const writer = await spawnAgent(provider, {
  task: `Write a one-paragraph bug report for this finding, suitable for a GitHub issue:\n\n${research}`,
  tools: [],
});

console.log("Research:", research);
console.log("\nBug report:", writer);
