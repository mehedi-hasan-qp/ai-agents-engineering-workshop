# Session Script: AI Agents Engineering Workshop

This is my speaker script for running the workshop end to end. It's written
the way I'd actually talk, not a formal lecture. Each section has what I
say, what I run on screen, and what I ask the room. Total runtime is about
3 hours including two short breaks. Adjust down by cutting the multi-agent
patterns to one or two if we're tight on time.

Before people arrive: `pnpm install` already run, `.env` filled in with a
Groq key, slides open at `localhost:4000` in one window, terminal open at
the repo root in another. Two windows, side by side, nothing else on screen.

---

## 0. Before we start (5 min)

**Say:**

"Grab a laptop, clone the repo, and get a free Groq API key while people
finish trickling in. Link's in the README. If your key isn't working by
the time we start, pair with your neighbor. Nobody's blocked on this."

**Do:** Walk the room, make sure everyone has `pnpm install` done and `.env`
filled in. This is the only part of the day that's boring, so get it out
of the way early.

**Ask:** "Who here has already built something with function calling or
tool use? Keep your hand up if you've built more than one agent." Gauge
the room. If most hands stay up past the second question, I'll move faster
through sections 1 to 3 and spend more time on MCP and multi-agent.

---

## 1. What we're actually building (10 min)

**Slide:** Title, "What we're actually building," "Agent ≠ LLM + prompt"

**Say:**

"Today we're building one thing: an engineering agent. It searches code,
reads files, lists directories, and runs tests against a small sample
project, a fake Pokédex API with a bug in it. By the end of the day it'll
also delegate to sub-agents, coordinate with other agents, defend itself
against a hostile file it's asked to read, and get evaluated automatically.

Here's the definition I want stuck in your head for the rest of the day:
an agent is a runtime that lets an LLM operate in an environment through
controlled actions. Not a smarter prompt. A runtime. Something that calls
the model, executes what it asks for, and decides what happens next.

We're doing this build-first. I'm going to run code, break it on purpose,
and then fix it, instead of talking at slides for three hours. If something
doesn't work in your terminal, say so immediately, don't just nod along."

**Do:** Open `examples/01-basic-llm`, show the folder structure, show
`.env.example`.

**Ask:** "Before I show you the loop: what's the actual difference between
calling an LLM API directly and calling it through an agent?" Let two or
three people answer. Someone will say "tools." Someone will say "it decides
things." Both are right, and that's exactly where we're headed.

---

## 2. Baseline: Example 01 (10 min)

**Slide:** "Agent ≠ LLM + prompt"

**Say:**

"Before there's any agent behavior, there's this." Show `provider.ts`.
"One interface. `chat(request)` in, `response` out. Every example in this
workshop uses the exact same shape, whether you're pointed at Groq, OpenAI,
or a local Ollama model. This is deliberate: the workshop shouldn't care
which vendor you picked this morning."

**Do:**

```bash
pnpm --filter 01-basic-llm start
```

Show the one-line response. That's it. No loop, no tools, no state.

**Say:** "This is the whole workshop's floor. Everything from here adds
exactly one capability at a time, and I want you to be able to point at
the line of code that added it."

---

## 3. Tool calling: Example 02 (20 min)

**Slide:** "Tool calling," code snippet of the `search_code` JSON call

**Say:**

"Here's the first real capability. The model can ask for a tool call, but
look closely at what that actually means." Open `index.ts` in
`02-tool-calling`.

"The model returns a message that says 'call search_code with this query.'
That's a request, not an execution. Nothing has run yet. This application
decides whether to run it, runs it, and only then sends the result back."

Point at the two `provider.chat()` calls in the file.

"First call: model asks for the tool. We run it ourselves, right here in
our own process. Second call: we hand the result back and get a real
answer. If you remember one sentence from this whole session, remember
this one: the model does not execute the tool, the application does."

**Do:**

```bash
pnpm --filter 02-tool-calling test:fixture
pnpm --filter 02-tool-calling start
```

Show the fixture test failing first, so people see there's a real bug to
find. Then run the example and narrate the two-call exchange live.

**Ask:** "What would happen if I just let the model's tool call arguments
run straight into a shell command, no validation, no review?" Let this
hang for a second. Someone will say "that's dangerous." Good, hold onto
that thought, we're coming back to it in the security section.

**Break for questions here.** This is usually where the "wait, so the model
can't actually do anything by itself?" question comes up. Answer it
directly: correct, it can't, and that's the whole point of a runtime.

---

## 4. The agent loop: Example 03 (20 min)

**Slide:** the `while (!finished)` loop

**Say:**

"Example 02 was one tool call. Real tasks need several, in an order the
model figures out as it goes. That's the loop." Open `agent.ts`.

"Ask the model. Did it request a tool? Run it, push the result, ask again.
Didn't request a tool? That's the final answer, return it. Two safeguards
matter here and I want to point at both: `MAX_ITERATIONS` and
`TOOL_TIMEOUT_MS`. Without the first, a model that gets stuck in a loop
just... keeps going, forever, burning your API budget. Without the second,
one hung tool call blocks the whole agent."

**Do:**

```bash
pnpm --filter 03-agent-loop start
```

Let it run without narrating every line this time. Then rewind and ask:

**Ask:** "How many round trips to the model did that take? Guess before I
scroll up." Then scroll up and count the tool calls together. This makes
the cost of an agent loop concrete instead of abstract.

**Say:** "Every one of those round trips is a full model call. Tokens,
latency, money. Keep that in your head, we're going to make it worse on
purpose in a minute."

---

## 5. State and context: Example 04 (15 min)

**Slide:** "Context and state"

**Say:**

"Two kinds of state, and I see people conflate them constantly. Conversation
history is everything sent to the model, every single call. Agent state
is bookkeeping the runtime needs for itself, and it never touches the
model." Point at `AgentState` in `agent.ts`.

"Here's the part that actually bites people in production: tool output.
If an agent reads a 50,000-token file, that file is now permanently in the
conversation, on every subsequent call, until the conversation ends. That's
not a hypothetical, that's the default behavior if you don't do anything
about it."

**Do:**

```bash
pnpm --filter 04-state start
```

Point at the truncation in the output, the `[truncated N more characters]`
line.

**Ask:** "If truncating tool output can hide the exact detail the model
needed, why do it anyway?" Good discussion question, no clean answer.
Push toward: the alternative, an unbounded context, fails more often and
more expensively than an occasionally-too-short one.

---

## 6. Tool design: Example 05 (15 min)

**Slide:** bad tool vs good tools

**Say:**

"I want to show you a genuinely bad tool." Open `badTool.ts`.

"`execute_anything(input: string)`. One opaque string, shells out to `sh -c`.
This is what happens when someone builds an agent by giving the model as
much power as possible instead of as much power as necessary. You cannot
classify this tool. You cannot validate its arguments before they run. You
cannot write a policy for it, because a policy needs to know what a tool
_does_, and this one can do anything."

Then open `tools.ts` / `registry.ts`.

"Compare: four narrow tools, each with a real schema, each tagged
read/write/execute. That tag is not decoration, it's what the security
example builds a policy on top of in a few hours."

**Do:**

```bash
pnpm --filter 05-tool-design start
```

**Ask:** "Somebody give me a real tool you've built or seen that looks more
like `execute_anything` than it should." This usually surfaces something
like a generic "run this SQL" tool or a raw HTTP-request tool. Good, real
examples make the danger concrete.

---

## Break (10 min)

---

## 7. Protocols and MCP: Example 06 (25 min)

**Slide:** "the problem" diagram, then "MCP," then "MCP architecture"

**Say:**

"Before I show MCP, I want to show the problem it solves." Point at the
"without protocol" slide.

"If every agent needs a custom integration for GitHub, Slack, your
filesystem, your database, that's N agents times M tools, all hand-rolled,
all maintained separately. MCP's whole pitch is one client speaking one
protocol to any number of servers, instead of that mess."

Open `mcpServer.ts`.

"Same four tools you've already seen. Nothing about the tools changed.
What changed is how the agent reaches them."

**Do:**

```bash
pnpm --filter 06-mcp test:fixture
pnpm --filter 06-mcp start:stdio
```

"Stdio transport: the client just spawned the server as a child process
and talked to it over stdin and stdout. No network, no port."

```bash
pnpm --filter 06-mcp start:http
```

"Same server, same tools, now running standalone over HTTP. This one's
worth a war story: when I built this, the HTTP version threw a 500 on the
second request every time. Took me a while to track down that stateless
MCP transports are single-use by design, you have to create a fresh one
per request. It's in the SDK's own source, just not obvious until you hit
it. I mention this because it's a good example of the difference between
reading docs and actually running the thing."

**Ask:** "What's actually decoupled here? Be specific." Push past "the
protocol" to: the agent's tool-calling code doesn't know or care whether
`search_code` is a local function, a stdio subprocess, or a remote HTTP
service. That's the decoupling.

---

## 8. Sub-agents: Example 07 (15 min)

**Slide:** `spawnAgent` snippet

**Say:**

"Delegation. `spawnAgent` isn't a trick, it's a real, independent agent
loop, same code you've already seen, just called from inside a function
instead of from your terminal." Open `spawnAgent.ts`.

"Notice what it gets: a fresh message history, and only the tools its task
needs. It never sees the parent's conversation. The parent never sees its
intermediate tool calls, only the final result it hands back. That
isolation is the entire point, not a side effect."

**Do:**

```bash
pnpm --filter 07-sub-agent start
```

**Ask:** "Why would you isolate a sub-agent's context instead of just
giving it the full conversation so far?" Good answers: focus (less to
reason about), safety (it can't see things it doesn't need), and cost
(smaller context, fewer tokens per call). All three are right.

---

## 9. Multi-agent systems: Example 08 (25 min)

**Slide:** four-pattern diagram, then "when NOT to use multi-agent"

**Say:**

"Four patterns, all built on the exact same `spawnAgent` you just saw."

```bash
pnpm --filter 08-multi-agent exec tsx src/supervisor.ts
```

"Supervisor: one coordinator, independent branches, sub-agents never talk
to each other."

```bash
pnpm --filter 08-multi-agent exec tsx src/sequential.ts
```

"Sequential: each stage's output becomes the next stage's input. Simple,
predictable, and slow, because nothing overlaps."

```bash
pnpm --filter 08-multi-agent exec tsx src/parallel.ts
```

"Parallel: three agents investigate the same question at once, a fourth
synthesizes. Faster wall-clock time, same total token cost as running them
one after another."

```bash
pnpm --filter 08-multi-agent exec tsx src/critic.ts
```

"Critic loop: generator proposes, critic reviews, generator revises, for
a fixed number of rounds. Notice it's fixed, not 'until it's good enough.'
An open-ended loop here is how you burn through a budget without anyone
deciding to."

**Say (important, slow down here):**

"Now the slide that matters more than any pattern I just showed you.
Multi-agent is not automatically better. Every one of those four patterns
costs more tokens and more latency than a single agent with the same
tools would. I've watched teams reach for multi-agent because it sounds
impressive in a demo, and end up with something slower, more expensive,
and harder to debug than the single-agent version they started with."

**Ask:** "Give me a real task where multi-agent is worth it, and a real
task where it isn't." Push for specifics, not "it depends." A good pairing:
"summarizing a document" doesn't need it; "researching a topic from three
independent angles and reconciling disagreement" might.

---

## Break (10 min)

---

## 10. Security: Example 09 (20 min)

**Slide:** prompt injection diagram, then permissions table

**Say:**

"Two things stacked on the plain agent loop here. First, classification and
policy." Open `policy.ts`.

"Every tool is read, write, or execute. The policy maps that to automatic,
approval, or blocked. Reads run without asking. Anything that executes
needs a human. I built nothing in this workshop destructive enough to
hard-block, but a real policy absolutely should have that third bucket."

**Do:**

```bash
pnpm --filter 09-security start
```

Answer `y` when prompted, narrate the pause. "The loop is literally
blocked right now, waiting on me."

Run it again, answer `n` this time, show the denial message flow back to
the model as a structured result instead of a crash.

**Say:**

"Second thing, and this is the one people underestimate: open the fixture's
README." Show the HTML comment with the injected instruction.

"This is indirect prompt injection. Nobody typed this into the chat. It's
sitting in a file the agent was told to read as part of its normal job.
If the agent treats everything it reads as instructions, this comment
tries to get it to loop `run_tests` forever and lie about the result.
The system prompt tells it to only follow user instructions. The approval
gate is the backstop in case that's not enough on its own, because it
usually isn't enough on its own."

**Ask:** "Where else in a real system would untrusted content end up in
front of an agent, besides a README?" Push for concrete answers: a GitHub
issue, a Slack message, a web page the agent fetched, an email. This is
the point where the abstract threat becomes obviously everywhere.

---

## 11. Reliability: Example 10 (15 min)

**Slide:** "tool failed" flow

**Say:**

"Agents fail in ways normal applications mostly don't: wrong tool, malformed
arguments, a tool that just hangs, a model that confidently reports success
on something that failed." Open `reliableAgent.ts`.

"Every tool result here is the same shape, whether it succeeded or not:
`{ ok, result, error }`. The model always knows what it's looking at.
Timeouts stop a hung tool from hanging the whole run. Retries give a
transient failure, think a flaky network call, a second chance before it
becomes a real error the model has to reason about."

**Do:**

```bash
pnpm --filter 10-reliability start
```

Point at `flakyTools.ts` beforehand: "this one fails on purpose, once,
then works. Watch the retry recover it without the model ever seeing the
failure."

**Ask:** "What's the difference between a bug you'd catch in a normal unit
test and a bug that only shows up because an LLM is calling your code?"
Good prompt for real war stories from the room if anyone's shipped an
agent before.

---

## 12. Observability: Example 11 (10 min)

**Slide:** trace tree diagram

**Say:**

"No platform, no dashboard, just structured lines." Open `tracedAgent.ts`.

"One JSON line per LLM call, one per tool call, one at the end with total
iterations and duration. That's genuinely enough to reconstruct exactly
what happened after the fact."

**Do:**

```bash
pnpm --filter 11-observability start
```

Read a couple of the JSON lines out loud as they print.

**Ask:** "If you had to debug 'the agent gave a wrong answer' in production,
what's the first field in this trace you'd look at?" Usually lands on tool
arguments or iteration count. Both good instincts.

---

## 13. Evaluation: Example 12 (15 min)

**Slide:** input vs trajectory diagram

**Say:**

"Normal testing: input goes in, one expected output comes out. Agents
don't work that way, the same task has many valid paths to a correct
answer." Open `dataset.json`.

"So we don't score the exact wording of the final answer. We score the
trajectory: did it call the tools we expected, did it finish before
burning its whole iteration budget. Deterministic, no second LLM call
judging the first one, reproducible."

**Do:**

```bash
pnpm --filter 12-evaluation start
```

**Say:** "Watch, one of these two tasks is going to fail on purpose, because
I wrote a task the model can technically answer without using the tool I
expected." Point at the FAIL line and the reason printed under it.

**Ask:** "What's a weakness of scoring by tool calls instead of by the
actual answer?" Good answer: the model could call all the right tools and
still get the conclusion wrong. Rule-based scoring catches process, not
correctness. Worth being honest about that trade-off.

---

## 14. Production architecture (15 min)

**Slide:** the full architecture diagram, final mental model quote

**Say:**

"Zoom out. Everything today lived inside one runtime process. In
production, this splits across real boundaries." Walk the diagram top to
bottom: application API, agent runtime, model, state, policy, tool layer,
MCP or direct API calls or a database underneath, observability and
evaluation and security wrapped around all of it.

"Point at any box on this diagram and I should be able to tell you which
example we ran today lives there. State: example four. Policy: example
nine. Tool layer over MCP: example six. If you can't map today's code to
this diagram, that's the gap to close before Monday."

Close with the quote, read it slowly, don't rush the last slide:

"The model provides intelligence, the runtime provides agency. The tools
provide capabilities, protocols provide interoperability, state provides
continuity, policies provide control, evaluation provides confidence."

**Ask (final, open to the room):** "What's the first agent you're actually
going to build with this, and which of today's twelve examples do you
think you'll copy from the most?" Let this run long if people are engaged,
it's the best signal of whether the day landed.

---

## Facilitation notes

**If Groq rate-limits someone mid-demo:** pair them with a neighbor, don't
stop the room to debug one person's key. Keep a spare key ready as backup.

**If a live demo fails on stage:** narrate the failure instead of panicking
and fixing it silently. "This is actually a great example of example 10,
watch what the error looks like." Half the reliability section writes
itself if something breaks live.

**Time is tight:** cut multi-agent to two patterns (supervisor and critic
loop cover the most ground) and shorten the observability section to a
single trace read-through instead of a full narration.

**Someone asks "why not LangChain / a framework":** answer honestly. A
framework hides exactly the mechanics we spent today exposing. Fine choice
for production once you understand what it's abstracting, a bad first
teacher for understanding the underlying loop.
