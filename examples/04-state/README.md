# 04 - State and Context

Two kinds of state, kept deliberately separate:

- **Conversation history** (`messages`) - the model's entire view of the
  world. Every token in it is sent, and paid for, on every single call.
- **Agent state** (`AgentState`) - runtime bookkeeping (iteration count,
  which tools were called) that the model never sees and costs nothing.

Also demonstrates **truncation**: tool output over `MAX_TOOL_RESULT_CHARS`
(800) is cut before it reaches the model, so one large file read can't blow
out the context window. `pokedex.ts` is about 5,800 characters, so every
read of it is truncated - the run prints how much the model never saw.

And **what it costs**: prompt tokens per call, taken from the provider's
`usage` field. Each call re-sends the whole history, so the total billed is
several times the final context.

## Run

```bash
pnpm --filter 04-state test:fixture
pnpm --filter 04-state start
```
