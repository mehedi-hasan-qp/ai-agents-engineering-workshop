# 03 - Agent Loop

Turns one-shot tool calling into a loop: observe, decide, act, feed the
result back, repeat - until the model gives a final answer or a safeguard
(`MAX_ITERATIONS`, `TOOL_TIMEOUT_MS`) kicks in.

The agent now has four tools and has to figure out on its own which ones
to call, in what order, to explain the failing Pokédex API test.

## Run

```bash
pnpm --filter 03-agent-loop test:fixture
pnpm --filter 03-agent-loop start
```
