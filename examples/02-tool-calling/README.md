# 02 - Tool Calling

Introduces the `search_code` tool against a bundled fixture project: a tiny
Pokédex API (`src/fixture/pokedex-api`) with one deliberately failing test.

The key concept: **the model does not execute the tool. The application
does.** The model can only ask for `search_code({ query })` - it's this
code that decides to run it and feeds the result back as a `tool` message.

## Run

```bash
pnpm --filter 02-tool-calling test:fixture   # confirm the fixture has a failing test
pnpm --filter 02-tool-calling start
```
