import { loadConfig } from "./config.ts";
import { OpenAICompatibleProvider, type ChatMessage } from "./provider.ts";
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
const toolCall = first.message.toolCalls?.[0];

if (!toolCall) {
  console.log(first.message.content);
  process.exit(0);
}

console.log(`Model requested: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);

const result = await searchCode(toolCall.arguments as { query: string });
console.log(`Tool result:\n${result}\n`);

messages.push(first.message, {
  role: "tool",
  content: result,
  toolCallId: toolCall.id,
});

const final = await provider.chat({ messages, tools: [searchCodeSchema] });
console.log(final.message.content);
