# 04 - State and Context

Two kinds of state, kept deliberately separate:

- **Conversation history** (`messages`) - the model's entire view of the
  world. Every token in it is sent, and paid for, on every single call.
- **Agent state** (`AgentState`) - runtime bookkeeping (iteration count,
  which tools were called) that the model never sees and costs nothing.

Also demonstrates **truncation**: tool output over `MAX_TOOL_RESULT_CHARS`
is cut before it reaches the model, so one large file read can't blow out
the context window.

## Run

```bash
pnpm --filter 04-state test:fixture
pnpm --filter 04-state start
```
