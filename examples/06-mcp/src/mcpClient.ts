import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "./agent.ts";

// Turns whatever tools an MCP server advertises into the same `Tool` shape
// the agent loop already knows how to run. The agent doesn't know or care
// that these calls go over MCP instead of being local functions.
export async function discoverTools(client: Client): Promise<Tool[]> {
  const { tools } = await client.listTools();

  return tools.map((tool) => ({
    schema: {
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.inputSchema,
    },
    run: async (args: Record<string, unknown>) => {
      const result = await client.callTool({
        name: tool.name,
        arguments: args,
      });
      const content = result.content as Array<{ type: string; text?: string }>;
      return content.find((block) => block.type === "text")?.text ?? "";
    },
  }));
}
