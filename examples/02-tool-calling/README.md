# 02 - Tool Calling

Introduces the `search_code` tool against a bundled fixture project: a tiny
Pokédex API (`src/fixture/pokedex-api`) with one deliberately failing test.

The key concept: **the model does not execute the tool. The application
does.** The model can only ask for `search_code({ query })` - it's this
code that decides to run it and feeds the result back as a `tool` message.

The model may ask for several calls in one turn. Each gets its own `tool`
message with the matching `tool_call_id`, or the next request is rejected.

See the raw traffic with `LLM_DEBUG=1 pnpm 02`: the request, the
`tool_calls` response, and a second request that re-sends everything.

## Run

```bash
pnpm --filter 02-tool-calling test:fixture   # confirm the fixture has a failing test
pnpm --filter 02-tool-calling start
```
