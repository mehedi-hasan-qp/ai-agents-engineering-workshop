# AI Agents Engineering Workshop

Six sessions on how a coding harness actually works — Claude Code, Codex, pi,
opencode. Provider, system prompt, tools, the loop, the write tool, context
and memory, protocols, delegation, policy, reliability, evaluation.

Two tracks running in parallel:

- **`examples/`** — the instructor builds an **Engineering Agent** that
  investigates and fixes a bundled Pokédex API fixture with one deliberately
  failing test.
- **`harness/`** — you build a **QuestionPro Wiki Harness** over an offline
  snapshot of the public help centre, one stage per week, as homework.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable`)
- Your own LLM API key (one per person, never shared)

## Setup

```bash
git clone <your fork>
cd ai-agents-engineering-workshop
git remote add upstream https://github.com/salauddin-sifat-qp/ai-agents-engineering-workshop.git
pnpm install
cp .env.example .env    # then paste your key in
```

Start every session with `git pull upstream main`. Upstream only touches
`examples/`, `packages/` and docs; you only touch `harness/`. No conflicts.

## Configure a provider

```env
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

Default: **[Google Gemini](https://aistudio.google.com/apikey)** free tier,
already filled in `.env.example`. Any OpenAI-compatible endpoint with tool
calling works.

**Each participant needs their own key.** The free tier is rate-limited per
key, so one shared key across a room fails immediately. The provider retries
429s automatically (`packages/llm-provider/src/provider.ts`) — you will still
see them, it will still recover.

Use a personal Google account; corporate Workspace accounts often block AI
Studio. `.env` is gitignored, and a fork of a public repo is public.

## Run an example

```bash
pnpm 01          # shorthand for: pnpm --filter 01-basic-llm start
```

The fixture ships with a failing test. Confirm it before running the agent:

```bash
pnpm --filter 03-agent-loop test:fixture
pnpm 03
```

Examples with more than one entry point:

```bash
pnpm 06          # edit_file  - the good write tool
pnpm 06:naive    # write_file - the bad one, run this first
pnpm 07          # compaction + memory + session persistence
pnpm 07:resume
pnpm 08          # MCP against a real external server
pnpm 08:server   # MCP over stdio, our own server
pnpm 08:http     # MCP over HTTP
pnpm 10          # multi-agent: supervisor
pnpm 10:sequential
pnpm 10:parallel
pnpm 10:critic
```

Examples 06 and 07 write to their fixture. Undo with:

```bash
pnpm --filter 06-write-tool reset
```

## Homework

```bash
pnpm harness     # run your own harness
pnpm verify      # structural checks, offline and free
pnpm golden      # score against 10 fixed questions
```

Assignments and success criteria: [`harness/README.md`](harness/README.md)

## Progression

| #   | Example         | Concept                                                              | Session |
| --- | --------------- | -------------------------------------------------------------------- | ------- |
| 01  | `basic-llm`     | `User -> LLM -> Response`; the provider interface; the system prompt | 1       |
| 02  | `tool-calling`  | The model requests, the application executes                         | 1       |
| 03  | `agent-loop`    | Observe -> decide -> act -> repeat, with `MAX_ITERATIONS`            | 2       |
| 04  | `state`         | Conversation history vs. agent state; tool-output truncation         | 2       |
| 05  | `tool-design`   | Narrow typed tools vs. `execute_anything`; a `ToolRegistry`          | 3       |
| 06  | `write-tool`    | `edit_file` vs. `write_file`: read-before-write, exact match, diffs  | 3       |
| 07  | `context`       | Compaction vs. truncation; `AGENTS.md` memory; session resume        | 4       |
| 08  | `mcp`           | Consuming a real external server; then writing your own              | 5       |
| 09  | `sub-agent`     | `spawnAgent` — nested loop, isolated context                         | 5       |
| 10  | `multi-agent`   | Supervisor, sequential, parallel, critic loop                        | 5       |
| 11  | `security`      | Tool classification, approval gate, prompt injection                 | 6       |
| 12  | `reliability`   | Timeouts, retries, structured tool errors                            | 6       |
| 13  | `observability` | Structured JSON tracing of every LLM and tool call                   | 6       |
| 14  | `evaluation`    | Rule-based scoring of an agent's tool-call trajectory                | 6       |

## Maintainer

Regenerate the corpus (instructor only, and not mid-workshop — it invalidates
`golden.json`):

```bash
pnpm snapshot
```

## Glossary

[`CONTEXT.md`](CONTEXT.md)
