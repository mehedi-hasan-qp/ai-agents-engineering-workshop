import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { runAgent } from "./agent.ts";
import { loadConfig } from "llm-provider/config";
import { discoverTools } from "./mcpClient.ts";
import { OpenAICompatibleProvider } from "llm-provider/provider";

// Same tools, different transport: the server runs standalone over HTTP and
// the client connects to it like it would to any remote service.
const server = spawn("npx", ["tsx", "src/http-server.ts"], {
  stdio: "inherit",
});
await sleep(1000);

const client = new Client({ name: "workshop-agent", version: "1.0.0" });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL("http://localhost:4400/mcp")));
} catch (error) {
  server.kill();
  throw new Error(
    `Could not reach MCP HTTP server: ${error instanceof Error ? error.message : String(error)}`,
  );
}

const tools = await discoverTools(client);
console.log(
  `Discovered ${tools.length} tools over MCP (http): ${tools.map((t) => t.schema.name).join(", ")}`,
);

const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const systemPrompt =
  "You are an engineering agent investigating a small TypeScript project. " +
  "Use the available tools to find and explain the cause of any failing test.";

const answer = await runAgent(
  provider,
  tools,
  systemPrompt,
  "Why is the Pokédex API test suite failing?",
);
console.log(answer);

await client.close();
server.kill();
