# 05 - Tool Design

Contrasts one bad tool against four good ones.

`execute_anything(input: string)` (`badTool.ts`) takes one opaque string and
shells out to `sh -c`. It can't be classified as read/write/execute, can't
be validated, and gives the model unrestricted power over the host.

The good tools (`tools.ts`) are narrow, typed, and each declared with a
`ToolKind` (`read`/`write`/`execute`) in a `ToolRegistry` - the classification
Example 11 (Security) builds a policy on top of.

## Run

```bash
pnpm --filter 05-tool-design start
```
