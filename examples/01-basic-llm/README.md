# 01 - Basic LLM

The baseline. `User -> LLM -> Response`. No agent behavior yet.

This is the `LLMProvider` interface every later example builds on: a thin
wrapper around any OpenAI-compatible `/chat/completions` endpoint, so the
workshop never locks you into one vendor.

## Run

```bash
pnpm --filter 01-basic-llm start
```
