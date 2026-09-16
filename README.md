# AI Agents Engineering Workshop

A hands-on, build-first workshop on AI agent architecture: tool calling,
the agent loop, context/state, tool design, MCP, sub-agents, multi-agent
systems, security, reliability, observability, and evaluation.

Everything is built around one running example - an **Engineering Agent**
that investigates a bundled sample project (a tiny "Pokédex API" with one
deliberately failing test) using real tools: `search_code`, `read_file`,
`list_files`, `run_tests`.

> An AI agent is a runtime that allows an LLM to operate in an environment
> through controlled actions.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) (`corepack enable` will get you one)
- An LLM API key (see below - a free one takes two minutes)

## Setup

```bash
pnpm install
cp .env.example .env
```

## Configure an LLM provider

Every example talks to any OpenAI-compatible `/chat/completions` endpoint
through one interface:

```ts
interface LLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}
```

Set three environment variables in `.env`:

```env
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

| Provider | Cost | Notes |
| --- | --- | --- |
| **[Groq](https://console.groq.com/keys)** (recommended) | Free API key, no card required | `LLM_BASE_URL=https://api.groq.com/openai/v1`, fast, tool calling supported |
| [OpenRouter](https://openrouter.ai/keys) | Free-tier models available | `LLM_BASE_URL=https://openrouter.ai/api/v1`, model support for tool calling varies |
| [Google Gemini](https://aistudio.google.com/apikey) | Free tier | Use its OpenAI-compatible endpoint: `LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai` |
| [OpenAI](https://platform.openai.com/api-keys) | Paid, free trial credits for new accounts | `LLM_BASE_URL=https://api.openai.com/v1` |
| [Ollama](https://ollama.com) (local) | Free, runs on your machine | `LLM_BASE_URL=http://localhost:11434/v1`, no `LLM_API_KEY` needed, pick a model with tool-calling support |

If `.env` is missing or incomplete, every example fails fast with:

```text
Missing LLM_API_KEY, LLM_BASE_URL or LLM_MODEL.

Copy .env.example to .env and configure an API provider.
```

## Run

Each example is a standalone, self-contained pnpm workspace package - no
shared `src/`, so any example can be read and run in isolation.

```bash
pnpm --filter 01-basic-llm start
```

Most examples run against a bundled Pokédex API fixture with a deliberately
failing test. Confirm it fails as expected before running the agent:

```bash
pnpm --filter 03-agent-loop test:fixture
pnpm --filter 03-agent-loop start
```

## Slides

Slides, the production architecture doc, and the facilitator's speaker
script live on the [`gh-pages` branch](https://github.com/salauddin-sifat-qp/ai-agents-engineering-workshop/tree/gh-pages), not here:

- Live deck: <https://salauddin-sifat-qp.github.io/ai-agents-engineering-workshop/>
- Architecture: [`docs/architecture.md`](https://github.com/salauddin-sifat-qp/ai-agents-engineering-workshop/blob/gh-pages/docs/architecture.md)
- Speaker script: [`script.md`](https://github.com/salauddin-sifat-qp/ai-agents-engineering-workshop/blob/gh-pages/script.md)

## Workshop progression

| # | Example | Concept |
| --- | --- | --- |
| 01 | `basic-llm` | Baseline: `User -> LLM -> Response`, no agent behavior |
| 02 | `tool-calling` | The model requests a tool call, the application executes it |
| 03 | `agent-loop` | Observe -> decide -> act -> repeat, with `MAX_ITERATIONS` / timeouts |
| 04 | `state` | Conversation history vs. agent state, tool-output truncation |
| 05 | `tool-design` | Narrow typed tools vs. `execute_anything(input)`, a `ToolRegistry` |
| 06 | `mcp` | The same tools exposed over MCP, via stdio and HTTP transports |
| 07 | `sub-agent` | `spawnAgent` - a real nested agent loop with isolated context |
| 08 | `multi-agent` | Supervisor, sequential, parallel, and critic-loop patterns |
| 09 | `security` | Tool classification, an approval gate, prompt injection |
| 10 | `reliability` | Timeouts, retries, structured tool errors, bounded iterations |
| 11 | `observability` | Structured JSON tracing of every LLM and tool call |
| 12 | `evaluation` | Rule-based scoring of an agent's tool-call trajectory |

## Glossary

See [`CONTEXT.md`](CONTEXT.md) for the project's glossary of terms.
