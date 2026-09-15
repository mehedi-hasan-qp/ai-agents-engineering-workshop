import type { LLMConfig } from "./config.ts";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolSchema {
  name: string;
  description: string;
  // JSON Schema for the tool's arguments.
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolSchema[];
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
        messages: toWireMessages(request.messages),
        tools: request.tools?.map(toWireTool),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LLM request failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = await response.json();
    return { message: fromWireMessage(data.choices[0].message) };
  }
}

function toWireMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    tool_call_id: message.toolCallId,
    tool_calls: message.toolCalls?.map((call) => ({
      id: call.id,
      type: "function",
      function: { name: call.name, arguments: JSON.stringify(call.arguments) },
    })),
  }));
}

// Models occasionally emit malformed JSON for tool arguments; fail closed
// with an empty object rather than crashing the whole agent loop.
function parseToolArguments(raw: string | undefined): Record<string, unknown> {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function toWireTool(tool: ToolSchema) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromWireMessage(raw: any): ChatMessage {
  return {
    role: raw.role,
    content: raw.content ?? "",
    toolCalls: raw.tool_calls?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any): ToolCall => ({
        id: call.id,
        name: call.function.name,
        arguments: parseToolArguments(call.function.arguments),
      }),
    ),
  };
}
