# 13 - Observability

`tracedAgent.ts` logs one structured JSON line per LLM call and per tool
call - model, tokens, duration, tool name, arguments, whether it succeeded,
a preview of the result - plus one `run_end` line with totals.

```text
Agent Run
 |- LLM Call    { model, promptTokens, completionTokens, finishReason, durationMs }
 |- Tool Call   { name, args, ok, resultChars, resultPreview, durationMs }
 |- LLM Call
 |- run_end     { iterations, promptTokens, completionTokens, durationMs }
```

Tokens come from the provider's `usage` field, not an estimate.

No platform, no dashboard - `console.log(JSON.stringify(...))` is enough to
reconstruct exactly what an agent run did.

## Run

```bash
pnpm --filter 13-observability test:fixture
pnpm --filter 13-observability start
```
