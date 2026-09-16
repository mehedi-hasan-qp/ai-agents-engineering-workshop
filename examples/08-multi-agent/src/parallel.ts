import { runAgent } from "./agent.ts";
import { loadConfig } from "llm-provider/config";
import { OpenAICompatibleProvider } from "llm-provider/provider";
import { spawnAgent } from "./spawnAgent.ts";
import { readFileSchema, readFileTool, searchCode, searchCodeSchema } from "./tools.ts";

// Independent agents investigate the same question from different angles at
// the same time; a synthesizer reconciles their answers into one.
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const tools = [
  { schema: searchCodeSchema, run: searchCode },
  { schema: readFileSchema, run: readFileTool },
];

const [byCorrectness, byReadability, byRisk] = await Promise.all([
  spawnAgent(provider, {
    task: "Is the whitespace bug in getPokemonByName a correctness issue? Explain briefly.",
    tools,
  }),
  spawnAgent(provider, {
    task: "Is the getPokemonByName code readable? Explain briefly.",
    tools,
  }),
  spawnAgent(provider, {
    task: "How risky would a one-line fix (adding .trim()) be? Explain briefly.",
    tools,
  }),
]);

const synthesis = await runAgent(
  provider,
  [],
  "Combine the three short reviews below into one final recommendation.",
  `Correctness: ${byCorrectness}\nReadability: ${byReadability}\nRisk: ${byRisk}`,
);

console.log(synthesis);
