import type { LLMConfig } from "llm-provider/config";

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
    const stopSpinner = startSpinner();
    try {
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
        throw new Error(`LLM request failed: ${await formatApiError(response)}`);
      }

      const data = await response.json();
      return { message: data.choices[0].message };
    } finally {
      stopSpinner();
    }
  }
}

// Shows progress while waiting on the model. No-op outside a TTY so piped
// or CI output stays clean.
function startSpinner(): () => void {
  if (!process.stdout.isTTY) return () => {};

  const frames = ["\u28f7", "\u28ef", "\u28df", "\u28bf", "\u287f", "\u28fb", "\u28fd", "\u28fe"];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i++ % frames.length]} thinking...`);
  }, 80);

  return () => {
    clearInterval(interval);
    process.stdout.write("\r\x1b[K");
  };
}

// Providers return a JSON error body of varying shape. Pull out just the
// status and message instead of dumping the raw payload at the caller.
async function formatApiError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body);
    const errorObj = Array.isArray(parsed) ? parsed[0] : parsed;
    const message = errorObj?.error?.message ?? body;
    return `${response.status} ${message}`;
  } catch {
    return `${response.status} ${body}`;
  }
}
