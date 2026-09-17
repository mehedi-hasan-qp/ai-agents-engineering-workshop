import { readFile } from "node:fs/promises";
import path from "node:path";

// Scores your harness against harness/golden.json.
//
// Session 1 you will score around 2/10 and that is the point: it is a baseline
// you beat over six weeks. The number only means something because the
// questions never change.
//
// It looks for an exported `ask(question)` in your harness. Until you write
// one, every question is skipped.

interface GoldenQuestion {
  id: string;
  ask: string;
  expect: string[];
  source: string;
}

const goldenFile = path.resolve(import.meta.dirname, "../golden.json");
const golden = await loadGolden();

const ask = await loadAskFunction();

if (!ask) {
  console.log("No `ask(question: string): Promise<string>` exported from src/agent.ts.");
  console.log("Export one once you have an agent loop (session 2), then re-run `pnpm golden`.");
  process.exit(0);
}

let passed = 0;

for (const question of golden.questions) {
  const started = Date.now();
  let answer = "";

  try {
    answer = await ask(question.ask);
  } catch (error) {
    answer = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Substring scoring, deliberately crude. It rewards a correct fact in the
  // answer and ignores wording. Example 14 shows why scoring the trajectory
  // matters at least as much as scoring the final string.
  const hit = question.expect.every((needle) =>
    answer.toLowerCase().includes(needle.toLowerCase()),
  );
  if (hit) passed++;

  console.log(
    `${hit ? "PASS" : "FAIL"}  ${question.id.padEnd(26)} ${Date.now() - started}ms` +
      (hit
        ? ""
        : `\n      expected all of: ${question.expect.join(", ")}` +
          `\n      got: ${answer.replace(/\s+/g, " ").slice(0, 160)}`),
  );
}

console.log(`\nscore: ${passed}/${golden.questions.length}`);

async function loadGolden(): Promise<{ questions: GoldenQuestion[] }> {
  const raw = await readFile(goldenFile, "utf-8");

  try {
    return JSON.parse(raw) as { questions: GoldenQuestion[] };
  } catch (error) {
    throw new Error(
      `${goldenFile} is not valid JSON. Restore it with ` +
        `\`git checkout -- harness/golden.json\`. (${
          error instanceof Error ? error.message : String(error)
        })`,
    );
  }
}

// src/agent.ts is the file YOU write - it does not exist yet, so the specifier
// is built at runtime to keep the type checker from resolving a module that is
// legitimately absent until session 2.
async function loadAskFunction(): Promise<((question: string) => Promise<string>) | undefined> {
  const specifier = "./agent.ts";

  try {
    const agentModule = (await import(specifier)) as {
      ask?: (question: string) => Promise<string>;
    };
    return typeof agentModule.ask === "function" ? agentModule.ask : undefined;
  } catch {
    return undefined;
  }
}
