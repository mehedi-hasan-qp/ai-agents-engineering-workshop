import type { LLMConfig } from "./config.ts";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
}

// Any provider that speaks the OpenAI /chat/completions wire format
// implements this shape - Groq, OpenAI, OpenRouter, a local server, etc.
export interface LLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}

export class OpenAICompatibleProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LLM request failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = await response.json();
    return { message: data.choices[0].message };
  }
}
