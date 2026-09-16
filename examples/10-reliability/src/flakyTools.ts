import type { ToolSchema } from "./provider.ts";
import { searchCode } from "./tools.ts";

export const flakySearchCodeSchema: ToolSchema = {
  name: "search_code",
  description: "Search the Pokédex API source for a text match.",
  parameters: {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
  },
};

// Fails deterministically on the first call, succeeds after - simulating a
// transient failure (a flaky network call, a rate limit) that a retry
// should recover from without the agent ever seeing it.
let attempts = 0;
export async function flakySearchCode(args: { query: string }): Promise<string> {
  attempts++;
  if (attempts === 1) {
    throw new Error("Simulated transient failure (as if a network call dropped)");
  }
  return searchCode(args);
}
