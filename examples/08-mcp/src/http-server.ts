import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./mcpServer.ts";

const PORT = 4400;
const HOST = "127.0.0.1";
const LOCAL_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

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
  // These tools run `npm test` on this machine. Two checks the MCP spec asks
  // for: bind to localhost only (below), and reject requests whose Host or
  // Origin is not us - otherwise any web page you visit can reach this port
  // through DNS rebinding.
  if (!isLocalRequest(req)) {
    res.writeHead(403).end("Forbidden: this MCP server only accepts local requests");
    return;
  }

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

// Non-browser clients send no Origin; a browser always does.
function isLocalRequest(req: IncomingMessage): boolean {
  if (!LOCAL_HOSTS.has(req.headers.host ?? "")) return false;

  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return LOCAL_HOSTS.has(new URL(origin).host);
  } catch {
    return false;
  }
}

// Without a host argument Node listens on every interface, which on shared
// workshop wifi means everyone else in the room.
httpServer.listen(PORT, HOST, () =>
  console.log(`MCP HTTP server listening on http://${HOST}:${PORT}/mcp`),
);
