import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listFiles, readFileTool, runTests, searchCode } from "./tools.ts";

// The same four tools from earlier examples, now exposed through MCP instead
// of called as plain functions. The agent's job doesn't change - only how
// it reaches the tools does.
export function createServer(): McpServer {
  const server = new McpServer({
    name: "pokedex-engineering-tools",
    version: "1.0.0",
  });

  server.registerTool(
    "search_code",
    {
      description: "Search the Pokédex API source for a text match.",
      inputSchema: { query: z.string() },
    },
    async ({ query }) => ({
      content: [{ type: "text", text: await searchCode({ query }) }],
    }),
  );

  server.registerTool(
    "read_file",
    {
      description: "Read the contents of a file in the Pokédex API project.",
      inputSchema: { path: z.string() },
    },
    async ({ path }) => ({
      content: [{ type: "text", text: await readFileTool({ path }) }],
    }),
  );

  server.registerTool(
    "list_files",
    {
      description: "List files in the Pokédex API project.",
      inputSchema: { path: z.string().optional() },
    },
    async ({ path }) => ({
      content: [{ type: "text", text: await listFiles({ path }) }],
    }),
  );

  server.registerTool(
    "run_tests",
    { description: "Run the Pokédex API test suite and return the results." },
    async () => ({ content: [{ type: "text", text: await runTests() }] }),
  );

  return server;
}
