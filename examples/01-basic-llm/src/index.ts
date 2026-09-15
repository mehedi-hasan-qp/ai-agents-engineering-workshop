import { loadConfig } from "./config.ts";
import { OpenAICompatibleProvider } from "./provider.ts";

// The baseline, before any agent behavior exists: a user message goes in,
// a model response comes out. No tools, no loop, no state.
const config = loadConfig();
const provider = new OpenAICompatibleProvider(config);

const response = await provider.chat({
  messages: [
    { role: "user", content: "In one sentence, what is an AI agent?" },
  ],
});

console.log(response.message.content);
