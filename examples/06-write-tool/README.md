# 06 - The Write Tool

The first tool in this workshop that changes something. Everything before this
was read-only: the agent could explain the bug but never fix it.

This is the hardest tool in any coding harness. Claude Code, Codex, opencode
and pi all converge on roughly the same design, and all of them got there by
hitting the same failure modes.

## Two versions, run both

```bash
pnpm 06:naive     # write_file(path, content) - whole-file rewrite
git diff examples/06-write-tool/src/fixture
pnpm --filter 06-write-tool reset
```

`write_file` is what everyone builds first. The model regenerates the entire
file from memory. Watch what it silently drops: comments, unrelated functions,
formatting. It cannot be reviewed, because "ok" is the only thing it reports.

```bash
pnpm 06           # edit_file(path, old_text, new_text)
git diff examples/06-write-tool/src/fixture
pnpm --filter 06-write-tool reset
```

`edit_file` replaces one exact snippet, and enforces four rules.

## The four rules

| Rule                                      | Failure it prevents                                              |
| ----------------------------------------- | ---------------------------------------------------------------- |
| **Read before write**                     | Editing a remembered version of the file instead of the real one |
| **Exactly one match**                     | Silently editing the wrong occurrence                            |
| **Zero matches is an error, not a no-op** | The agent believing an edit landed when it did not               |
| **Return a diff**                         | A human being unable to review what changed                      |

Each failure returns a _different_ message. A model only recovers from a
failure it can tell apart — `edit failed` makes it retry the identical call
until the iteration budget runs out.

## Where enforcement lives

Read-before-write is tracked by the runtime (`filesRead` in `editTool.ts`,
populated from the loop in `agent.ts`), not by asking the model nicely in the
system prompt. A rule the model is merely asked to follow is a rule it will
eventually skip. The prompt states the workflow so the model cooperates; the
code enforces it so it cannot do otherwise.

## Run

```bash
pnpm --filter 06-write-tool test:fixture   # confirm the test fails first
pnpm 06
pnpm --filter 06-write-tool test:fixture   # ...and passes after
pnpm --filter 06-write-tool reset          # restore the fixture
```
