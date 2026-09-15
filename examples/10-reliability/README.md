# 10 - Reliability

`reliableAgent.ts` wraps every tool call with:

- **timeouts** (`TOOL_TIMEOUT_MS`) - a hung tool can't hang the agent
- **retries** (`MAX_RETRIES`) - transient failures get a second chance
  before surfacing as an error
- **structured errors** - every tool result is `{ ok, result?, error? }`,
  so the model always gets a predictable shape whether the tool succeeded
  or failed, instead of a bare string it has to guess about
- **max iterations** - the loop gives up cleanly instead of running forever

`flakyTools.ts` simulates a transient failure (fails once, then succeeds)
so you can watch the retry actually recover it.

```text
Tool failed
 -> agent receives { ok: false, error }
 -> agent retries or tries a different tool
```

## Run

```bash
pnpm --filter 10-reliability test:fixture
pnpm --filter 10-reliability start
```
