# 10 - Multi-Agent Systems

Four patterns, each a small runnable script reusing the same `spawnAgent` /
`runAgent` primitives from Example 09:

- `supervisor.ts` - one coordinator delegates independent branches to
  specialist sub-agents and combines their results itself.
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
pnpm --filter 10-multi-agent exec tsx src/supervisor.ts
pnpm --filter 10-multi-agent exec tsx src/sequential.ts
pnpm --filter 10-multi-agent exec tsx src/parallel.ts
pnpm --filter 10-multi-agent exec tsx src/critic.ts
```
