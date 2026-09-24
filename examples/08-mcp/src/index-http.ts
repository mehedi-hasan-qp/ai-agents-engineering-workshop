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

// 127.0.0.1, not localhost: the server binds IPv4 only, and localhost may
// resolve to ::1 first.
const SERVER_URL = "http://127.0.0.1:4400/mcp";

// Always stop the server, even when the run fails - otherwise the next run
// dies on "port 4400 already in use".
try {
  const client = await connectWhenReady();

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
} finally {
  server.kill();
}

// Cold `npx tsx` start-up time varies by laptop, so poll instead of guessing
// with a fixed sleep.
async function connectWhenReady(): Promise<Client> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 20; attempt++) {
    const client = new Client({ name: "workshop-agent", version: "1.0.0" });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(SERVER_URL)));
      return client;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }
  throw new Error(
    `Could not reach MCP HTTP server: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
