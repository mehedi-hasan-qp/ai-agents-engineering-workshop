import type { ChatMessage, LLMProvider } from "llm-provider/provider";
import { runWithPolicy } from "./policy.ts";
import type { Tool } from "./registry.ts";

const MAX_ITERATIONS = 8;

// Same loop as Example 03, but every tool call is routed through the policy
// instead of run directly - the approval gate blocks the loop until a human
// answers, exactly where PRD section 16 asks for it.
export async function runSecureAgent(
  provider: LLMProvider,
  tools: Tool[],
  systemPrompt: string,
  task: string,
): Promise<string> {
  const toolsByName = new Map(tools.map((tool) => [tool.schema.name, tool]));
  const schemas = tools.map((tool) => tool.schema);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: task },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await provider.chat({ messages, tools: schemas });
    const toolCalls = response.message.toolCalls ?? [];

    if (toolCalls.length === 0) {
      return response.message.content;
    }

    messages.push(response.message);

    for (const toolCall of toolCalls) {
      console.log(`  ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
      const tool = toolsByName.get(toolCall.name);
      const result = tool
        ? await runGuarded(tool, toolCall.arguments)
        : `Unknown tool: ${toolCall.name}`;

      messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
    }
  }

  return `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`;
}

// A tool that throws (a missing file, a path outside the fixture) must come
// back to the model as a result, not crash the run mid-demo.
async function runGuarded(tool: Tool, args: unknown): Promise<string> {
  try {
    return await runWithPolicy(tool, args);
  } catch (error) {
    return `Tool failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}
