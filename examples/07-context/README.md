# 07 - Context Engineering

Example 04 kept the context small by **truncating** every tool result to 800
characters. That works until the detail the agent needed was in the part you
threw away.

This example does the three things a real harness does instead.

## 1. Compaction

Full tool results go into the context. When the context crosses a threshold,
the harness asks the model to summarise the oldest middle section and
continues with the summary in its place.

```text
[system] [task] [........ summarised ........] [recent turns kept verbatim]
```

- **System prompt and original task stay verbatim.** Lose those and the agent
  forgets what it was doing.
- **Recent turns stay verbatim.** That is where the live work is.
- **The middle gets summarised.** That is where the bulk and the redundancy is.

"Recent" is measured in size as well as count. If one huge tool result sits
in the recent window, keeping it verbatim would leave the context over the
threshold and trigger compaction again every turn, so the window shrinks
until it fits.

Truncation deletes. Compaction remembers, in less space. Watch for the
`[compacted N -> M tokens]` line in the output.

## 2. Memory

`fixture/pokedex-api/AGENTS.md` is read at startup and pasted into the system
prompt. That is the entire mechanism — the same one behind `CLAUDE.md`,
`AGENTS.md`, and pi's memory. No vector store, no retrieval step.

The `remember` tool appends to that file, so a fact learned in this run is
present in the system prompt of the next one. Memory that costs tokens on
every single call, which is why it has to stay short.

## 3. Session persistence

Every message is appended to `.session/transcript.jsonl` as it happens, not
at the end, and the file is never rewritten. Compaction is logged as its own
entry, so the full history stays on disk for debugging while a resume starts
from the compacted context. A tool call interrupted before its result landed
is dropped on resume, so the model is asked again. Resume with:

```bash
pnpm 07          # run, then interrupt it with Ctrl-C partway through
pnpm 07:resume   # picks up from the saved transcript
```

A session you can only resume after a clean exit is a session you cannot
resume.

## The one non-obvious constraint

When compaction drops the middle of the conversation, it can orphan a tool
result whose tool call is now gone. Most providers reject that request
outright. `compaction.ts` guards against it by never cutting between a call
and its results. Every harness that implements compaction hits this bug once.

## Run

```bash
pnpm 07
pnpm 07:resume
pnpm --filter 07-context reset   # restore AGENTS.md, delete the session
```
