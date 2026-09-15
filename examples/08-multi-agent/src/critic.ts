import { runAgent } from "./agent.ts";
import { loadConfig } from "./config.ts";
import { OpenAICompatibleProvider } from "./provider.ts";

// Generator proposes a fix, critic reviews it, generator revises - repeated
// for a fixed number of rounds rather than until some open-ended "good
// enough" signal, to keep the loop bounded.
const ROUNDS = 2;

const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

let draft = await runAgent(
  provider,
  [],
  "You fix bugs. Propose a one-line fix for: getPokemonByName does not trim whitespace before comparing names.",
  "Propose the fix.",
);

for (let round = 0; round < ROUNDS; round++) {
  const critique = await runAgent(
    provider,
    [],
    "You are a strict code reviewer. Point out one concrete flaw in the proposed fix, or say APPROVED if there are none.",
    draft,
  );

  console.log(`Round ${round + 1} critique:`, critique);
  if (critique.includes("APPROVED")) break;

  draft = await runAgent(
    provider,
    [],
    "You fix bugs. Revise your previous fix based on the critique.",
    `Previous fix: ${draft}\nCritique: ${critique}`,
  );
}

console.log("\nFinal fix:", draft);
