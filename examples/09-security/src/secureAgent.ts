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
    const toolCall = response.message.toolCalls?.[0];

    if (!toolCall) {
      return response.message.content;
    }

    messages.push(response.message);

    const tool = toolsByName.get(toolCall.name);
    const result = tool
      ? await runWithPolicy(tool, toolCall.arguments)
      : `Unknown tool: ${toolCall.name}`;

    messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
  }

  return `Gave up after ${MAX_ITERATIONS} iterations without a final answer.`;
}
