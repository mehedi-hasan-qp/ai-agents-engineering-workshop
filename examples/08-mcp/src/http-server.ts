import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./mcpServer.ts";

const PORT = 4400;

// Stateless mode (sessionIdGenerator: undefined) means each transport is
// single-use: the SDK asserts a stateless transport is never reused across
// requests, so we create a fresh server + transport per request instead of
// sharing one across the whole process.
const httpServer = createHttpServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    void handleRequest(req, res, body);
  });
});

async function handleRequest(req: IncomingMessage, res: ServerResponse, body: string) {
  let parsedBody: unknown;
  try {
    parsedBody = body ? JSON.parse(body) : undefined;
  } catch {
    res.writeHead(400).end("Invalid JSON body");
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await createServer().connect(transport);
  await transport.handleRequest(req, res, parsedBody);
}

httpServer.listen(PORT, () =>
  console.log(`MCP HTTP server listening on http://localhost:${PORT}/mcp`),
);
