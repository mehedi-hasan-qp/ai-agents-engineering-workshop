# 07 - Sub-Agent

`spawnAgent({ task, tools })` runs a real, independent agent loop - its own
message history, its own iteration budget, only the tools its task needs.
The parent agent never sees its intermediate tool calls, only the final
result it reports back.

This is isolation, not simulation: the sub-agent costs real LLM calls and
can fail or time out on its own, independently of the parent.

## Run

```bash
pnpm --filter 07-sub-agent test:fixture
pnpm --filter 07-sub-agent start
```
