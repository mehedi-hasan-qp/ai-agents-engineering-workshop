# 14 - Evaluation

Agent evaluation isn't `input -> expected output` - the same task can be
solved through many different valid tool sequences. `dataset.json` encodes
what a _reasonable trajectory_ looks like instead of one exact answer:

```json
{ "task": "...", "expectedTools": ["run_tests"], "maxIterations": 5 }
```

`score.ts` checks the trajectory, not the wording of the final answer:

- were the expected tools actually called
- did the agent finish before burning its entire iteration budget

No second LLM call, no judgment calls - deterministic and reproducible.

## Run

```bash
pnpm --filter 14-evaluation test:fixture
pnpm --filter 14-evaluation start
```
