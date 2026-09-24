import { readFile } from "node:fs/promises";
import { loadConfig } from "llm-provider/config";
import { runAgent, type Tool } from "./evalAgent.ts";
import { OpenAICompatibleProvider } from "llm-provider/provider";
import { score, type EvalTask } from "./score.ts";
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
  "Use the available tools to answer the question.";

const dataset: EvalTask[] = await loadDataset();

async function loadDataset(): Promise<EvalTask[]> {
  const raw = await readFile(new URL("dataset.json", import.meta.url), "utf-8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `dataset.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

let passed = 0;
for (const evalTask of dataset) {
  const run = await runAgent(provider, tools, systemPrompt, evalTask.task, evalTask.maxIterations);
  const result = score(evalTask, run);

  console.log(`${result.pass ? "PASS" : "FAIL"} - ${result.task}`);
  // Print the path either way. A FAIL on a path that still reached the right
  // answer is the scorer's blind spot, not the agent's.
  console.log(`  trajectory: ${run.toolsCalled.join(" -> ") || "(no tools)"}`);
  if (!result.pass) {
    result.reasons.forEach((reason) => console.log(`  - ${reason}`));
  }
  if (result.pass) passed++;
}

console.log(`\n${passed}/${dataset.length} passed`);
