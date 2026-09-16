# 01 - Basic LLM

The baseline. `User -> LLM -> Response`. No agent behavior yet.

This is the `LLMProvider` interface every later example builds on: a thin
wrapper around any OpenAI-compatible `/chat/completions` endpoint, so the
workshop never locks you into one vendor.

## System prompt vs. user message

Two different roles go into every `chat()` call:

- **system** - sets the model's operating mode: persona, constraints,
  rules. Written by the application, not the end user. Sent on every call,
  same as the conversation itself.
- **user** - the actual request. What the person (or, later, the agent
  runtime on their behalf) is asking for.

A model generally treats the system message as its highest-priority
instruction, overriding anything conflicting in the user message or in
tool output. Example 09 (Security) relies on exactly that property: its
system prompt tells the agent to only follow user instructions, as a
defense against a file it reads trying to inject its own.

## Run

```bash
pnpm --filter 01-basic-llm start
```
