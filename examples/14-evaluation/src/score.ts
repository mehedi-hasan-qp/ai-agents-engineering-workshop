import type { AgentRun } from "./evalAgent.ts";

export interface EvalTask {
  task: string;
  expectedTools: string[];
  maxIterations: number;
}

export interface EvalResult {
  task: string;
  pass: boolean;
  reasons: string[];
}

// Rule-based scoring: no second LLM call, no judgment calls - just checks
// on the trajectory that either hold or don't. Cheap, deterministic,
// reproducible, and enough to catch an agent that's using the wrong tools
// or spinning without making progress.
export function score(task: EvalTask, run: AgentRun): EvalResult {
  const reasons: string[] = [];

  const missingTools = task.expectedTools.filter((tool) => !run.toolsCalled.includes(tool));
  if (missingTools.length > 0) {
    reasons.push(`Never called expected tool(s): ${missingTools.join(", ")}`);
  }

  if (run.iterations >= task.maxIterations) {
    reasons.push(`Used all ${task.maxIterations} iterations without a confident final answer`);
  }

  return { task: task.task, pass: reasons.length === 0, reasons };
}
