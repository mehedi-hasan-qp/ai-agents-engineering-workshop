import type { LLMConfig } from "./config.ts";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  // Gemini's OpenAI-compat layer ties reasoning to each function call via
  // this opaque token. It must be echoed back unmodified on the next turn,
  // or Gemini rejects the request. Other providers just ignore it.
  thoughtSignature?: unknown;
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

const MAX_ATTEMPTS = 4;
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 30_000;

export class OpenAICompatibleProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const stopSpinner = startSpinner();
    try {
      const response = await this.send(request);
      const data = await response.json();
      return { message: fromWireMessage(data.choices[0].message) };
    } finally {
      stopSpinner();
    }
  }

  // Transport-level retry. Rate limits and 5xx are facts about the network,
  // not information the model can act on, so the harness handles them itself
  // and the conversation never sees them. Contrast with a *tool* failure,
  // which is fed back to the model as a structured result so it can change
  // strategy - that lives in the agent loop (example 12), not here.
  private async send(request: ChatRequest): Promise<Response> {
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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

      if (response.ok) return response;

      lastError = await formatApiError(response);
      if (!isRetryable(response.status) || attempt === MAX_ATTEMPTS) {
        throw new Error(`LLM request failed: ${lastError}`);
      }

      const waitMs = retryDelayMs(response, attempt);
      process.stderr.write(
        `\r\x1b[K${response.status === 429 ? "rate limited" : "server error"} (${response.status}), ` +
          `retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})\n`,
      );
      await sleep(waitMs);
    }

    throw new Error(`LLM request failed: ${lastError}`);
  }
}

// 429 is the one every attendee on a free tier will hit. 5xx and 408 are
// transient by definition. Everything else (401, 400, 404) will fail the same
// way on every retry, so retrying only wastes the remaining quota.
function isRetryable(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

// Providers tell you how long to wait when they feel like it; back off
// exponentially when they don't. Jitter keeps a room full of attendees who
// all got rate-limited at once from retrying in lockstep.
function retryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  const seconds = header ? Number(header) : Number.NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_BACKOFF_MS);

  const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  return backoff + Math.random() * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function toWireMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    tool_call_id: message.toolCallId,
    tool_calls: message.toolCalls?.map((call) => ({
      id: call.id,
      type: "function",
      function: { name: call.name, arguments: JSON.stringify(call.arguments) },
      ...(call.thoughtSignature !== undefined && {
        extra_content: { google: { thought_signature: call.thoughtSignature } },
      }),
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
        thoughtSignature: call.extra_content?.google?.thought_signature,
      }),
    ),
  };
}
