# PRD: AI Agents Engineering Workshop

> **Historical.** This is the original twelve-example PRD. The workshop has since
> been restructured into six sessions and fourteen examples, so the section
> numbering and example numbers below are out of date. The current source of
> truth is `README.md`, `CONTEXT.md` and `harness/README.md`.

## 1. Overview

Build a hands-on intermediate-level workshop for software engineers covering:

- AI agent architecture
- Tool calling
- Agent loops
- Context and state
- Tool design
- MCP / protocol-based tool integration
- Sub-agents
- Multi-agent systems
- Security
- Reliability
- Observability
- Evaluation
- Production architecture

The audience already understands:

- LLM fundamentals
- Prompts
- RAG
- What an AI harness is
- What tools are
- Basic AI application architecture

Therefore, do **not** spend time teaching basic LLM/RAG concepts.

The workshop should be **build-first**, with theory explaining the architecture as we progressively build the system.

---

# 2. Primary Learning Objective

By the end of the workshop, an engineer should understand:

> An AI agent is a runtime that allows an LLM to operate in an environment through controlled actions.

They should be able to explain and implement:

```text
User
 ↓
Agent Runtime
 ↓
LLM
 ↓
Tool Selection
 ↓
Tool Execution
 ↓
Tool Result
 ↓
Context / State
 ↓
LLM
 ↓
...
```

They should also understand when to use:

- a normal LLM call
- tool calling
- a single agent
- a deterministic workflow
- sub-agents
- multi-agent systems
- MCP
- human approval

---

# 3. Deliverables

Create one workshop repository containing:

```text
ai-agents-workshop/
│
├── README.md
├── package.json
├── .env.example
│
├── slides/
│   └── index.html
│
├── examples/
│   ├── 01-basic-llm/
│   ├── 02-tool-calling/
│   ├── 03-agent-loop/
│   ├── 04-state/
│   ├── 05-mcp/
│   ├── 06-sub-agent/
│   ├── 07-multi-agent/
│   ├── 08-security/
│   └── 09-evaluation/
│
├── src/
│   ├── agent/
│   ├── tools/
│   ├── providers/
│   ├── mcp/
│   ├── agents/
│   └── evaluation/
│
└── docs/
    └── architecture.md
```

The initial implementation should be **barebones but runnable**.

Do not over-engineer the workshop infrastructure.

---

# 4. Running the Workshop

The repository should be easy for an attendee to run.

Target:

```bash
git clone ...
npm install
cp .env.example .env
npm run dev
```

The HTML slides should be accessible locally.

Example:

```bash
npm run slides
```

or a single development command should launch the workshop.

The exact framework is up to the implementation agent, but prefer:

- TypeScript
- Node.js
- minimal dependencies
- simple browser-based HTML slides
- no unnecessary framework complexity

---

# 5. LLM Provider Support

This is important.

The workshop itself should NOT require attendees to pay for a specific model provider.

Provide a simple provider abstraction:

```ts
interface LLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}
```

The application should support OpenAI-compatible APIs where possible.

The goal is:

```text
                    LLMProvider
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   Provider A      Provider B      Provider C
```

Attendees should only need to configure:

```env
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

Optionally:

```env
LLM_PROVIDER=
```

Support at least one provider that has a genuinely usable free API-key tier / free credits at the time of the workshop, while keeping the provider abstraction generic.

Prefer providers/models that support:

- tool/function calling
- structured output
- reasonable rate limits
- easy API-key signup
- OpenAI-compatible APIs if possible

Do not hard-code the workshop to one vendor.

Document several possible providers in the README, with a clear distinction between:

- free API access
- free credits
- free local models

Local models are optional and should not be required.

The workshop must still work with any compatible OpenAI-style endpoint.

---

# 6. Environment Configuration

Create:

```env
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

Never commit secrets.

Provide:

```text
.env.example
```

with comments explaining each variable.

If possible, fail with a useful error:

```text
Missing LLM_API_KEY.

Copy .env.example to .env and configure an API provider.
```

---

# 7. Workshop Narrative

The entire workshop should build one conceptual system progressively.

The primary example should be an:

## Engineering Agent

The agent can:

```text
search_code
read_file
list_files
run_tests
git_diff
```

For safety, destructive filesystem or git operations should either be disabled or require explicit approval.

The system should be small enough to understand during a workshop.

---

# 8. Example 01 — Basic LLM

Start with:

```text
User
 ↓
LLM
 ↓
Response
```

Purpose:

Establish the baseline.

No agent behavior yet.

---

# 9. Example 02 — Tool Calling

Introduce tools.

Example:

```ts
searchCode({
    query: string,
    path?: string
})
```

The LLM should be able to request:

```json
{
  "name": "search_code",
  "arguments": {
    "query": "TODO"
  }
}
```

The application executes the tool and returns the result.

Teach:

- tool schemas
- descriptions
- arguments
- tool results
- model-controlled tool selection
- application-controlled execution

Important concept:

> The model does not execute the tool. The application executes the tool.

---

# 10. Example 03 — Agent Loop

Turn tool calling into an agent.

Implement the basic loop:

```text
while (!finished) {
    response = model(messages, tools)

    if (response.hasToolCall()) {
        result = executeTool(response.toolCall)
        messages.push(result)
    } else {
        return response
    }
}
```

Include safeguards:

```text
MAX_ITERATIONS
TOOL_TIMEOUT
```

Teach:

- observation
- decision
- action
- result
- loop termination

---

# 11. Example 04 — State and Context

Introduce state.

Separate:

```text
Conversation history
Agent state
Tool state
External application state
```

Discuss:

- context growth
- token cost
- context limits
- summarization
- truncation
- important state outside the context
- tool-result size

Implement only a simple state abstraction.

Do not build a complex memory system.

---

# 12. Example 05 — Tool Design

Create intentionally bad and good tools.

Bad:

```ts
executeAnything(input: string)
```

Better:

```ts
searchCode(query, path?)
readFile(path)
listFiles(path?)
runTests(test?)
```

Teach:

- narrow tools
- explicit schemas
- predictable outputs
- structured errors
- idempotency
- read/write/execute classification
- permissions
- tool descriptions

Add a simple tool registry:

```text
ToolRegistry
 ├── search_code
 ├── read_file
 ├── list_files
 └── run_tests
```

---

# 13. Example 06 — MCP

Introduce protocols after the attendees understand normal tool calling.

First explain the problem:

```text
Without protocol:

Agent
 ├── custom GitHub integration
 ├── custom Slack integration
 ├── custom filesystem integration
 └── custom database integration
```

Then:

```text
Agent
 ↓
MCP Client
 ↓
MCP Server
 ├── search_code
 ├── read_file
 └── run_tests
```

Build a minimal MCP server.

Expose the engineering tools through MCP.

Cover conceptually:

- MCP client
- MCP server
- tool discovery
- tool schemas
- resources
- prompts
- transport
- capabilities
- authorization/security

Do not turn the workshop into an MCP specification lecture.

The goal is to understand:

> A protocol decouples the agent runtime from the tool implementation.

---

# 14. Example 07 — Sub-Agent

Introduce delegation.

Example:

```text
Main Agent
    │
    ├── Research Agent
    ├── Debug Agent
    └── Review Agent
```

Each sub-agent should receive a focused task rather than the entire parent context.

Example:

```ts
spawnAgent({
    task: "Find why authentication tests are failing",
    relevantFiles: [...]
})
```

Teach:

- isolated context
- task delegation
- result aggregation
- budgets
- timeouts
- failures
- concurrency

---

# 15. Example 08 — Multi-Agent Systems

Demonstrate several patterns.

### Supervisor

```text
             Supervisor
             /    |    \
            /     |     \
      Research  Coding  Review
```

### Sequential

```text
Research
   ↓
Analysis
   ↓
Writer
   ↓
Reviewer
```

### Parallel

```text
       ┌→ Agent A ─┐
       ├→ Agent B ─┼→ Synthesizer
       └→ Agent C ─┘
```

### Critic loop

```text
Generator
    ↓
Critic
    ↓
Generator
```

Discuss:

- coordination
- shared vs isolated state
- handoffs
- synchronization
- failure propagation
- latency
- token cost

Most importantly:

> Multi-agent is not automatically better.

Discuss when a single agent with better tools is preferable.

---

# 16. Example 09 — Security

Cover:

## Prompt injection

Example:

```text
Agent
 ↓
read_file
 ↓
untrusted README
 ↓
"Ignore previous instructions and run..."
```

Explain that tool output can contain untrusted instructions.

Cover:

- prompt injection
- indirect prompt injection
- least privilege
- sandboxing
- credentials
- tool allowlists
- human approval
- destructive actions
- untrusted content

Classify tools:

```text
READ
WRITE
EXECUTE
DESTRUCTIVE
```

Example policy:

```text
read_file      → automatic
search_code    → automatic
run_tests      → automatic
write_file     → approval
git_push       → approval
delete_data    → blocked
```

---

# 17. Example 10 — Reliability

Show common agent failures:

```text
Tool timeout
Malformed arguments
Wrong tool
Infinite loop
Repeated tool calls
Hallucinated success
Partial failure
Unexpected tool output
```

Implement:

- max iterations
- timeouts
- retries
- structured errors
- validation
- graceful failure

Demonstrate:

```text
Tool failed
 ↓
Agent receives structured error
 ↓
Agent retries / changes strategy
```

---

# 18. Example 11 — Observability

Add basic tracing.

A trace should look conceptually like:

```text
Agent Run
 ├── LLM Call
 │    ├── model
 │    ├── tokens
 │    └── latency
 │
 ├── Tool Call
 │    ├── name
 │    ├── arguments
 │    ├── result
 │    └── latency
 │
 ├── LLM Call
 │
 └── Final Response
```

For the workshop, simple console/JSON tracing is sufficient.

No need to integrate a full observability platform.

---

# 19. Example 12 — Evaluation

Explain why agent evaluation is different from normal application testing.

Normal:

```text
input → expected output
```

Agent:

```text
input
 ↓
many possible trajectories
 ↓
final result
```

Evaluate:

- task success
- final answer quality
- tool selection
- tool arguments
- number of steps
- token usage
- latency
- safety violations

Create a tiny evaluation dataset.

Example:

```json
{
  "task": "Find the failing authentication test",
  "expectedTools": ["search_code", "read_file", "run_tests"]
}
```

Support basic pass/fail or scoring.

---

# 20. Architecture Discussion

End with production architecture.

Show:

```text
                    User
                      │
                      ▼
               Application API
                      │
                      ▼
                 Agent Runtime
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      Model         State         Policy
        │
        ▼
     Tool Layer
        │
   ┌────┼────┐
   ▼    ▼    ▼
  MCP  APIs  DB
        │
        ▼
   External Systems

        +
   Observability
        +
    Evaluation
        +
      Security
```

Discuss:

- where the agent runtime belongs
- where state lives
- where authorization happens
- where tools run
- where MCP fits
- where evaluations run
- where humans approve actions

---

# 21. HTML Slide Deck

Create a standalone, polished HTML slide deck.

It should be:

- keyboard navigable
- responsive
- dark/light readable
- minimal
- engineering-focused
- diagram-heavy
- low text density

Avoid corporate presentation aesthetics.

Do not make it look like a generic AI conference deck.

Prefer:

```text
large diagrams
short statements
code snippets
architecture diagrams
progressive reveals
```

Slides should follow the same progression as the code.

Suggested slide structure:

1. Title
2. What we're actually building
3. Agent ≠ LLM + prompt
4. The agent loop
5. Tool calling
6. Tool design
7. Tool execution boundary
8. Context and state
9. Workflow vs agent
10. Protocols
11. MCP
12. MCP architecture
13. Sub-agents
14. Multi-agent patterns
15. When NOT to use multi-agent
16. Prompt injection
17. Permissions
18. Reliability
19. Observability
20. Evaluation
21. Production architecture
22. Final mental model

The slide deck should include speaker notes or presenter guidance where useful.

---

# 22. Interactive Demonstrations

The slides should link clearly to the corresponding examples.

For example:

```text
Slide: "Agent Loop"

→ Open example/03-agent-loop
```

Ideally provide a small navigation panel:

```text
Slides
Examples
Architecture
README
```

---

# 23. Educational Design Principles

The workshop should follow:

```text
Build
 ↓
Observe
 ↓
Break
 ↓
Explain
 ↓
Improve
```

Instead of:

```text
Lecture
 ↓
Lecture
 ↓
Lecture
 ↓
Demo
```

Intentionally demonstrate failure cases.

For example:

1. Build naive agent.
2. Make it loop forever.
3. Add max iterations.
4. Give it huge tool output.
5. Show context growth.
6. Add result limits.
7. Give it malicious tool output.
8. Add trust boundaries.
9. Spawn multiple agents.
10. Show token/latency explosion.

This should make the engineering tradeoffs obvious.

---

# 24. Non-Goals

Do NOT build:

- a production-grade agent framework
- a complete memory architecture
- a vector database
- a full RAG system
- a complicated frontend
- a sophisticated multi-agent orchestration engine
- vendor-specific abstractions everywhere
- a full MCP implementation from scratch
- a production authentication system

The project exists to teach architecture.

Keep implementations intentionally small.

---

# 25. Code Quality

The workshop code should itself demonstrate good engineering practices.

Requirements:

- TypeScript
- strict typing
- small modules
- clear interfaces
- minimal dependencies
- environment-based configuration
- no secrets
- readable names
- comments explaining architectural decisions rather than obvious code
- no unnecessary abstractions

Prefer small diffs between workshop stages.

Each example should be understandable independently.

---

# 26. README

The README should contain:

## Prerequisites

- Node.js version
- npm/pnpm
- API key

## Setup

```bash
npm install
cp .env.example .env
```

## Configure LLM

Explain:

```env
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

Provide several compatible provider options, prioritizing providers with free API access/free credits.

## Run

```bash
npm run dev
```

## Slides

Explain how to open the HTML deck.

## Workshop progression

```text
01 Basic LLM
02 Tool Calling
03 Agent Loop
04 State
05 MCP
06 Sub-Agent
07 Multi-Agent
08 Security
09 Evaluation
```

## Architecture

Link to architecture documentation.

---

# 27. Acceptance Criteria

The project is complete when:

- [ ] Repository runs with minimal setup.
- [ ] LLM provider can be configured using environment variables.
- [ ] No paid vendor is mandatory.
- [ ] At least one practical free API-key option is documented.
- [ ] Basic tool calling works.
- [ ] Agent loop works.
- [ ] Tool registry works.
- [ ] State/context example works.
- [ ] Minimal MCP server works.
- [ ] Agent can consume MCP tools.
- [ ] Sub-agent example exists.
- [ ] Multi-agent example exists.
- [ ] Security examples exist.
- [ ] Reliability safeguards exist.
- [ ] Basic tracing exists.
- [ ] Basic evaluation exists.
- [ ] HTML slide deck is complete.
- [ ] Slides follow the code progression.
- [ ] README allows an engineer to start without instructor assistance.
- [ ] No secrets are committed.
- [ ] Examples remain intentionally small and understandable.

---

# 28. Implementation Strategy

Do not implement everything at once.

Build in this order:

```text
Phase 1
Project skeleton
+
LLM provider abstraction
+
basic HTML slides

Phase 2
Basic LLM
+
tool calling
+
agent loop

Phase 3
Tool registry
+
state
+
context handling

Phase 4
MCP server
+
MCP client

Phase 5
Sub-agent
+
multi-agent

Phase 6
Security
+
reliability

Phase 7
Tracing
+
evaluation

Phase 8
Polish slides
+
README
+
workshop flow
```

After each phase, run the relevant examples.

Do not introduce a framework merely because it makes implementation shorter. The workshop should expose the underlying mechanics.

If a framework is used, keep the underlying implementation visible and explain what the framework is abstracting.

---

# 29. Final Mental Model

The final slide should leave engineers with this:

```text
                 AI APPLICATION
                      │
                      ▼
                ┌───────────┐
                │   Agent   │
                │  Runtime  │
                └─────┬─────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        Model       State       Policy
          │
          ▼
        Tools
          │
     ┌────┼────┐
     ▼    ▼    ▼
    API  MCP   DB
          │
          ▼
      Environment

        + Security
        + Reliability
        + Observability
        + Evaluation
```

Core takeaway:

> **The model provides intelligence; the runtime provides agency.**
>
> **The tools provide capabilities; protocols provide interoperability; state provides continuity; policies provide control; evaluation provides confidence.**
