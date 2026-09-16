import { loadConfig } from "./config.ts";
import { OpenAICompatibleProvider } from "./provider.ts";

// The baseline, before any agent behavior exists: a user message goes in,
// a model response comes out. No tools, no loop, no state.
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

// The system message sets the model's operating mode for the whole
// conversation: persona, constraints, rules. It's sent on every call, same
// as the user message, and the model treats it as the highest-priority
// instruction. Every example after this one carries a system prompt.
const response = await provider.chat({
  messages: [
    {
      role: "system",
      content: "Answer in exactly one plain sentence, no caveats.",
    },
    { role: "user", content: "What is an AI agent?" },
  ],
});

console.log(response.message.content);
