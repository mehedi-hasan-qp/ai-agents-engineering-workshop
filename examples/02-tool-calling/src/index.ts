import { loadConfig } from "llm-provider/config";
import { OpenAICompatibleProvider, type ChatMessage } from "llm-provider/provider";
import { searchCode, searchCodeSchema } from "./tools.ts";

// The model can request a tool call, but it never runs the tool itself.
// The application decides whether to execute it and feeds the result back.
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const messages: ChatMessage[] = [
  {
    role: "system",
    content: "You are an engineering agent. Use the tools you're given.",
  },
  {
    role: "user",
    content: 'Search the codebase for "trim" and tell me what you find.',
  },
];

const first = await provider.chat({ messages, tools: [searchCodeSchema] });
const toolCalls = first.message.toolCalls ?? [];

if (toolCalls.length === 0) {
  console.log(first.message.content);
  process.exit(0);
}

messages.push(first.message);

// The model may request more than one call at once. Each one gets its own
// result, paired by id - miss one and the provider rejects the next request.
for (const toolCall of toolCalls) {
  console.log(`Model requested: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);

  const result = await searchCode(toolCall.arguments as { query: string });
  console.log(`Tool result:\n${result}\n`);

  messages.push({ role: "tool", content: result, toolCallId: toolCall.id });
}

const final = await provider.chat({ messages, tools: [searchCodeSchema] });
console.log(final.message.content);
