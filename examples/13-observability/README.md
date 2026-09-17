# 13 - Observability

`tracedAgent.ts` logs one structured JSON line per LLM call and per tool
call - model, duration, tool name, arguments, whether it succeeded - plus
one `run_end` line with the total iteration count and duration.

```text
Agent Run
 |- LLM Call    { model, durationMs }
 |- Tool Call   { name, args, durationMs, ok }
 |- LLM Call
 |- run_end     { iterations, durationMs }
```

No platform, no dashboard - `console.log(JSON.stringify(...))` is enough to
reconstruct exactly what an agent run did.

## Run

```bash
pnpm --filter 13-observability test:fixture
pnpm --filter 13-observability start
```
