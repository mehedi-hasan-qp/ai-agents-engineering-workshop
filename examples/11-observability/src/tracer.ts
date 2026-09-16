// A trace is just structured console output: one JSON line per LLM call or
// tool call, with enough detail to reconstruct the whole run afterwards.
// No platform to integrate - just discipline about what gets logged.
export type TraceEvent =
  | { type: "llm_call"; model: string; durationMs: number }
  | {
      type: "tool_call";
      name: string;
      args: unknown;
      durationMs: number;
      ok: boolean;
    }
  | { type: "run_end"; iterations: number; durationMs: number };

export function trace(event: TraceEvent): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...event }));
}

export async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, durationMs: Math.round(performance.now() - start) };
}
