# 06 - MCP

The same four tools from earlier examples, now exposed through the Model
Context Protocol instead of called as local functions (`mcpServer.ts`).

Two transports, same server code:

- **stdio** (`stdio-server.ts` / `index-stdio.ts`) - client spawns the server
  as a child process, no networking involved.
- **HTTP** (`http-server.ts` / `index-http.ts`) - server runs standalone on
  a port, client connects like it would to any remote service. Because this
  server is stateless (`sessionIdGenerator: undefined`), the SDK requires a
  fresh transport per request - it cannot be reused across requests.

`mcpClient.ts` turns whatever tools the server advertises into the same
`Tool` shape the agent loop already understands - the agent doesn't know or
care that its tools are running behind a protocol now.

> A protocol decouples the agent runtime from the tool implementation.

## Run

```bash
pnpm --filter 06-mcp test:fixture
pnpm --filter 06-mcp start:stdio
pnpm --filter 06-mcp start:http
```
