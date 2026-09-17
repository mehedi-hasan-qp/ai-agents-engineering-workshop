# 08 - MCP

Most harnesses are MCP **clients** far more often than they're MCP
**servers** — you're usually connecting to tools someone else built, not
building tools for someone else to connect to. This example leads with
that.

## Client-first: talking to a server you didn't write (`index-external.ts`)

Connects to Anthropic's official, unmodified `@modelcontextprotocol/server-filesystem`
(installed on the fly via `npx`, no code of ours involved) pointed at the
Pokédex fixture. `mcpClient.ts`'s `discoverTools()` and `agent.ts`'s
`runAgent()` are the exact same functions used everywhere else in this
workshop - the harness doesn't know or care that this server is a real,
external package it's never seen before.

That server has no `run_tests` tool, only file tools, so the task is
scoped to what it can actually do - same constraint you'd hit integrating
any real third-party server.

```bash
pnpm --filter 08-mcp start:external
```

## Building your own server (`mcpServer.ts`, `stdio-server.ts`, `http-server.ts`)

The same four tools from earlier examples, exposed through MCP instead of
called as local functions. Two transports, same server code:

- **stdio** (`stdio-server.ts` / `index-stdio.ts`) - client spawns the server
  as a child process, no networking involved.
- **HTTP** (`http-server.ts` / `index-http.ts`) - server runs standalone on
  a port, client connects like it would to any remote service. Because this
  server is stateless (`sessionIdGenerator: undefined`), the SDK requires a
  fresh transport per request - it cannot be reused across requests.

```bash
pnpm --filter 08-mcp test:fixture
pnpm --filter 08-mcp start:stdio
pnpm --filter 08-mcp start:http
```

> A protocol decouples the agent runtime from the tool implementation.
