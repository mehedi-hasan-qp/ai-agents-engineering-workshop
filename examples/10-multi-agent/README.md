# 10 - Multi-Agent Systems

Four patterns, each a small runnable script reusing the same `spawnAgent` /
`runAgent` primitives from Example 09:

- `supervisor.ts` - one coordinator delegates independent branches to
  specialist sub-agents, then a supervising model combines their reports.
  The branches are fixed in code to keep the pattern visible; example 09 is
  the model-driven version.
- `sequential.ts` - each stage's output becomes the next stage's input.
- `parallel.ts` - independent agents investigate the same question at once,
  a synthesizer reconciles their answers.
- `critic.ts` - generator proposes, critic reviews, generator revises, for a
  bounded number of rounds.

**Multi-agent is not automatically better.** Every pattern here costs more
tokens and latency than a single agent with the same tools would. Reach for
one only when the task genuinely decomposes into independent or adversarial
sub-tasks - not by default.

## Run

```bash
pnpm --filter 10-multi-agent test:fixture
pnpm 10              # supervisor
pnpm 10:sequential
pnpm 10:parallel
pnpm 10:critic
```
