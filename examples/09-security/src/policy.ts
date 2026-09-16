import { createInterface } from "node:readline/promises";
import type { Tool, ToolKind } from "./registry.ts";

export type Approval = "automatic" | "approval" | "blocked";

// Example policy: reads are automatic, execution needs a human in the loop,
// nothing in this workshop is destructive enough to hard-block, but a real
// policy would map some tool names straight to "blocked".
const POLICY_BY_KIND: Record<ToolKind, Approval> = {
  read: "automatic",
  write: "approval",
  execute: "approval",
};

export async function runWithPolicy(tool: Tool, args: unknown): Promise<string> {
  const approval = POLICY_BY_KIND[tool.kind];

  if (approval === "blocked") {
    return `Blocked by policy: ${tool.schema.name} is not permitted.`;
  }

  if (approval === "approval" && !(await confirm(tool.schema.name, args))) {
    return `Denied by operator: ${tool.schema.name} was not approved.`;
  }

  return tool.run(args);
}

async function confirm(toolName: string, args: unknown): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Approve ${toolName}(${JSON.stringify(args)})? [y/N] `);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}
