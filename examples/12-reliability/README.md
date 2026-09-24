# 12 - Reliability

The **semantic** retry: the model sees the failure and decides what to do.
Compare the transport retry in `packages/llm-provider`, which the model never
sees.

`reliableAgent.ts` wraps every tool call with:

- **timeouts** (`TOOL_TIMEOUT_MS`) - a hung tool can't hang the agent
- **structured errors** - every tool result is
  `{ ok, result?, error?, retryable? }`, so the model always gets a
  predictable shape, and knows whether trying again can help
- **max iterations** - the loop gives up cleanly instead of running forever

There is deliberately no automatic retry of tools in the harness. A timed-out
`edit_file` or `run_tests` may still be running, and repeating it can apply a
change twice. Only retry automatically what is safe to repeat.

`flakyTools.ts` takes `search_code` offline for the whole run. Watch the
trace: the model gets `ok: false, retryable: false`, stops calling search,
and finds the code through `list_files` and `read_file` instead.

```text
Tool failed
 -> agent receives { ok: false, error }
 -> agent retries (retryable) or tries a different tool (not retryable)
```

## Run

```bash
pnpm --filter 12-reliability test:fixture
pnpm --filter 12-reliability start
```
