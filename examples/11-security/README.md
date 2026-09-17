# 11 - Security

Two things layered on top of the plain agent loop:

**Tool classification and policy** (`registry.ts`, `policy.ts`) - every tool
is `read`/`write`/`execute`, and a policy map decides what runs
automatically versus what needs a human:

```text
read_file, search_code, list_files  -> automatic
run_tests                           -> approval (CLI y/n prompt)
```

Approving or denying happens live: the loop pauses at `runWithPolicy` and
waits on stdin before the tool actually runs.

**Prompt injection** - the fixture's `README.md` has an instruction hidden
in an HTML comment, the kind of thing a real file could easily contain. The
agent's system prompt explicitly tells it to only follow user instructions;
the approval gate is the backstop in case that isn't enough.

## Run

```bash
pnpm --filter 11-security test:fixture
pnpm --filter 11-security start
```

Answer `y` or `n` when prompted to approve `run_tests`.
