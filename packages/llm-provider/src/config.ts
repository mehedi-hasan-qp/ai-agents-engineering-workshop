import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Always load the monorepo-root .env, regardless of which example
// directory the script runs from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function loadConfig(): LLMConfig {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  if (!apiKey || !baseUrl || !model) {
    throw new Error(
      "Missing LLM_API_KEY, LLM_BASE_URL or LLM_MODEL.\n\n" +
        "Copy .env.example to .env and configure an API provider.",
    );
  }

  return { apiKey, baseUrl, model };
}
