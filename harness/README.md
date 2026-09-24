# Homework: build the QuestionPro Wiki Harness

Across six sessions you build your own harness in this folder. The instructor
builds the same ideas against a buggy Pokédex API in `examples/`; you build
them against the QuestionPro help centre.

**You only ever edit files under `harness/`.** Upstream never touches
`harness/src`, so `git pull upstream main` stays conflict-free all six weeks.

## The corpus

`harness/corpus/` is an offline snapshot of 162 public pages from
<https://www.questionpro.com/help>, captured as markdown.

Offline and committed, on purpose: no VPN, no wiki API key, no rate limits, no
internal data leaving your machine, and byte-identical results for everyone in
the room. `src/wikiClient.ts` is pre-built and reads it. **That file is
plumbing, not the lesson — do not rewrite it.**

## Two ways to know you are done

```bash
pnpm verify     # structure: does what you built have the right shape? (offline, free)
pnpm golden     # score: 10 fixed questions with known answers
```

`pnpm verify` reports `....` for checks you have not reached yet, so run it any
time. `pnpm golden` needs an `ask()` function, so it starts working in session 2.

Your first golden score, in week 2, is the baseline you beat for the rest of
the course. **Never edit `golden.json`** — a benchmark you move is not a
benchmark. The model is not deterministic, so one run is one sample: compare
weeks with `pnpm golden --runs=3`, not single runs.

## Ground rules

- Timebox yourself to 90 minutes. If you are stuck past that, stop and bring
  the stuck thing to the session. Being stuck is data.
- You are paired. Ask your pair before you ask the instructor.
- You are never blocked: `examples/` has a working reference for every stage.
  Copying it will not complete the assignment, because your tools, your
  corpus, and your `pnpm verify` checks are different. Adapt, don't paste.
- `.env` is gitignored. Your fork of a public repo is public. `pnpm verify`
  fails loudly if `.env` is ever committed. It cannot see a key you pasted
  into another file, so don't.
- At the top of each session, somebody demos their harness and explains their
  own code. Assume it will be you.

---

## Session 1 — provider, system prompt, one tool

Right now `src/index.ts` calls the model once and hands it search results in
the prompt. That is not an agent. Make the model _ask_ for the search instead.

Build `src/tools.ts` exporting a `tools` array. Start with one:

```ts
export const tools = [{ schema: searchDocsSchema, kind: "read", run: searchDocs }];
```

Then make one tool call execute end to end, the way `examples/02-tool-calling`
does: model requests, you execute, you hand the result back.

The model may ask for more than one tool call in a single response. Answer
every one, each with its own `toolCallId`.

Run it once with `LLM_DEBUG=1 pnpm harness` and read the request body. That
is everything the model knows.

**Done when:** `pnpm verify` passes the session 1 checks; one tool call
executes; the answer changes depending on what search returned.

If you see `rate limited (429), retrying in Ns`, that is the shared provider
recovering on its own. Do not work around it; screenshot it. Session 2 is
about why it exists, and next week's loop makes many more calls.

## Session 2 — the loop, retries, cost

Build `src/agent.ts`:

```ts
export const MAX_ITERATIONS = 10;
export async function ask(question: string): Promise<string>;
```

Add `read_page` to your tools. Wire the loop: model → tool → result → model,
until it stops asking for tools or hits the cap.

Print tokens and a cost estimate per run. Every `provider.chat()` response
carries `usage` (`promptTokens`, `completionTokens`) - sum them, don't
estimate from characters. You cannot manage what you do not measure, and the
number will surprise you.

If `finishReason` is `"length"`, the answer was cut off. Don't return it as if
it were complete.

**Done when:** `pnpm golden` runs and gives you a baseline score; a 429
recovers visibly instead of crashing; every run prints its own cost.

## Session 3 — the write tool

Build `src/edit.ts`:

```ts
export async function editPage(args: {
  slug: string;
  old_text: string;
  new_text: string;
  dry_run?: boolean;
}): Promise<string>;
```

Four rules, all enforced in code, none merely requested in the prompt:

1. Refuse a page the agent has not read this session.
2. `old_text` must match **exactly once** — zero and many are different errors.
3. A failed match is an error, never a silent no-op.
4. Return a diff, not `"ok"`.

One trap: `content.replace(old, new)` treats `$&` and `$$` in `new` as
patterns. Pass a function, `content.replace(old, () => new)`.

Stretch: refuse the edit if the page changed on disk since it was read.

Classify every tool `read` / `write` / `execute`.

**Done when:** `pnpm verify` passes the session 3 checks; `git diff
harness/corpus` shows a clean, minimal patch; reset with `pnpm --filter
harness reset`.

## Session 4 — context and sessions

Build `src/context.ts` (`COMPACT_THRESHOLD_CHARS`, `compact`) and
`src/session.ts` (`saveSession`, `loadSession`).

Stop truncating tool output. Let the context grow, and compact it when it
crosses the threshold: keep the system prompt and the task verbatim, keep the
recent turns verbatim, summarise the middle.

Persist the transcript after **every** turn, then add `--resume`. Appending
one line per message is better than rewriting the file: a crash can then
only lose the last line. `pnpm verify` round-trips `saveSession` /
`loadSession` through disk and puts your real session back afterwards.

When you cut the middle out, never cut between a tool call and its results.

Add a `MEMORY.md` your harness loads into the system prompt at startup.

**Done when:** `pnpm verify` passes the session 4 checks; a long run compacts
and keeps going; `--resume` picks up mid-task after a Ctrl-C.

## Session 5 — MCP

Expose your harness's tools as an MCP server over stdio.

Then connect a real harness to it — Claude Code, pi, Codex, whichever you use
— and drive your QuestionPro wiki tools from it.

Mark each tool with MCP annotations (`readOnlyHint: true` for search and read,
`destructiveHint: true` for edit). The client you connect uses them to decide
what needs approval - the same read/write/execute tag from session 3.

**Done when:** a coding agent you did not write is searching the QuestionPro
help centre through a server you did write. Screenshot it. This is the week
that makes the other five worth it.

## Session 6 — make it survivable, then demo

Add the approval policy (`write` and `execute` need a human), structured tool
errors, and one JSON trace line per LLM and tool call.

Then plant a poisoned page in your corpus — an instruction hidden in a help
article telling the agent to ignore its rules — and show what your harness
does about it. Run it twice, with and without your system-prompt defence,
and make sure the question you ask actually leads the agent to that page.
`pnpm verify` has no session 6 checks; the demo is the check.

**Done when:** `pnpm verify` is all green, `pnpm golden --runs=3` is your
best average of the six weeks, and you can demo the injection being
contained.

---

## Reference map

| Your session | Reference example                                                              |
| ------------ | ------------------------------------------------------------------------------ |
| 1            | `examples/01-basic-llm`, `examples/02-tool-calling`                            |
| 2            | `examples/03-agent-loop`, `examples/04-state`, `packages/llm-provider` (retry) |
| 3            | `examples/05-tool-design`, `examples/06-write-tool`                            |
| 4            | `examples/07-context`                                                          |
| 5            | `examples/08-mcp`, `examples/09-sub-agent`                                     |
| 6            | `examples/11-security` … `examples/14-evaluation`                              |
