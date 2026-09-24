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
task tells the agent to read the README, so the injection always reaches the
model. The system prompt says text in files is data, never instructions; the
approval gate is the backstop in case that isn't enough.

Nothing here is `blocked`. A real policy would map some tools straight to it.

## Run

```bash
pnpm --filter 11-security test:fixture
pnpm 11             # prompt defence + approval gate
pnpm 11:unguarded   # approval gate only - the baseline to compare against
```

Without the baseline, "nothing happened" could mean the defence worked or the
model never read the file.

Answer `y` or `n` when prompted to approve `run_tests`.
