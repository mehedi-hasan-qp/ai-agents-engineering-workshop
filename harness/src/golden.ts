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

// The model is not deterministic, so one run is one sample. `pnpm golden
// --runs=3` asks every question three times; compare averages, not single runs.
const runs = Math.max(
  1,
  Number(process.argv.find((arg) => arg.startsWith("--runs="))?.slice(7)) || 1,
);
const scores: number[] = [];

for (let run = 1; run <= runs; run++) {
  if (runs > 1) console.log(`\n--- run ${run}/${runs} ---`);
  let passed = 0;

  for (const question of golden.questions) {
    const started = Date.now();
    let answer = "";

    try {
      answer = await ask(question.ask);
    } catch (error) {
      answer = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Whole-token scoring, deliberately crude. It rewards a correct fact in
    // the answer and ignores wording. Example 14 shows why scoring the
    // trajectory matters at least as much as scoring the final string.
    const hit = question.expect.every((needle) => containsToken(answer, needle));
    if (hit) passed++;

    console.log(
      `${hit ? "PASS" : "FAIL"}  ${question.id.padEnd(26)} ${Date.now() - started}ms` +
        (hit
          ? ""
          : `\n      expected all of: ${question.expect.join(", ")}` +
            `\n      got: ${answer.replace(/\s+/g, " ").slice(0, 160)}`),
    );
  }

  scores.push(passed);
  console.log(`\nscore: ${passed}/${golden.questions.length}`);
}

if (runs > 1) {
  const mean = scores.reduce((sum, score) => sum + score, 0) / runs;
  console.log(
    `\nscores: ${scores.join(", ")}  mean: ${mean.toFixed(1)}/${golden.questions.length}`,
  );
}

// A plain substring check scores wrong answers as right: "K" is inside "OK"
// and "know", "8" is inside "128", "10" is inside "100". Match whole tokens
// instead. A number only needs to not touch other digits, so "20 MB" and
// "20MB" both count; a word must not touch letters or digits.
function containsToken(answer: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const edge = /^\d+$/.test(needle) ? "\\d" : "[\\p{L}\\p{N}]";
  return new RegExp(`(?<!${edge})${escaped}(?!${edge})`, "iu").test(answer);
}

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
