# AI Agents Engineering Workshop

Hands-on workshop on AI agent architecture: tool calling, agent loop, state, tool design, MCP, sub-agents, multi-agent systems, security, reliability, observability, evaluation.

Running example: an **Engineering Agent** that investigates a bundled "Pokédex API" fixture (one deliberately failing test) using `search_code`, `read_file`, `list_files`, `run_tests`.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- An LLM API key

## Setup

```bash
pnpm install
cp .env.example .env
```

## Configure a provider

Set in root `.env` (shared by every example, regardless of which directory you run from):

```env
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

Model must support tool/function calling.

| Provider | Cost | Base URL | Notes |
| --- | --- | --- | --- |
| **[Groq](https://console.groq.com/keys)** (recommended) | Free | `https://api.groq.com/openai/v1` | Fast. Use `openai/gpt-oss-20b`. |
| [OpenRouter](https://openrouter.ai/keys) | Free tier | `https://openrouter.ai/api/v1` | Tool-call support varies by model. |
| [Google Gemini](https://aistudio.google.com/apikey) | Free tier | `https://generativelanguage.googleapis.com/v1beta/openai` | Use full versioned model name, e.g. `gemini-2.0-flash-lite`. Slower. |
| [OpenAI](https://platform.openai.com/api-keys) | Paid | `https://api.openai.com/v1` | Free trial credits for new accounts. |
| [Ollama](https://ollama.com) (local) | Free | `http://localhost:11434/v1` | No `LLM_API_KEY` needed. Pick a tool-calling model. |

Missing/incomplete `.env` fails fast with a clear error.

## Run

```bash
pnpm 01          # numbered shortcut, same as:
pnpm --filter 01-basic-llm start
```

Multi-entry-point examples:

```bash
pnpm 06          # MCP over stdio
pnpm 06:http     # MCP over HTTP
pnpm 08          # multi-agent: supervisor
pnpm 08:sequential
pnpm 08:parallel
pnpm 08:critic
```

Fixture has a deliberately failing test — confirm before running the agent:

```bash
pnpm --filter 03-agent-loop test:fixture
pnpm --filter 03-agent-loop start
```

## Slides

On [`gh-pages`](https://github.com/salauddin-sifat-qp/ai-agents-engineering-workshop/tree/gh-pages), not here:

- Deck: <https://salauddin-sifat-qp.github.io/ai-agents-engineering-workshop/>
- Architecture: [`docs/architecture.md`](https://github.com/salauddin-sifat-qp/ai-agents-engineering-workshop/blob/gh-pages/docs/architecture.md)

## Progression

| # | Example | Concept |
| --- | --- | --- |
| 01 | `basic-llm` | `User -> LLM -> Response`, no agent behavior |
| 02 | `tool-calling` | Model requests a tool call, app executes it |
| 03 | `agent-loop` | Observe -> decide -> act -> repeat, with `MAX_ITERATIONS` / timeouts |
| 04 | `state` | Conversation history vs. agent state, tool-output truncation |
| 05 | `tool-design` | Narrow typed tools vs. `execute_anything(input)`, a `ToolRegistry` |
| 06 | `mcp` | Same tools over MCP, stdio and HTTP transports |
| 07 | `sub-agent` | `spawnAgent` — nested agent loop, isolated context |
| 08 | `multi-agent` | Supervisor, sequential, parallel, critic-loop patterns |
| 09 | `security` | Tool classification, approval gate, prompt injection |
| 10 | `reliability` | Timeouts, retries, structured tool errors, bounded iterations |
| 11 | `observability` | Structured JSON tracing of every LLM and tool call |
| 12 | `evaluation` | Rule-based scoring of an agent's tool-call trajectory |

## Glossary

[`CONTEXT.md`](CONTEXT.md)
