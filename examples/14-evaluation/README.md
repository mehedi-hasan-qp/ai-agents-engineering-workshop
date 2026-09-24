# 14 - Evaluation

Agent evaluation isn't `input -> expected output` - the same task can be
solved through many different valid tool sequences. `dataset.json` encodes
what a _reasonable trajectory_ looks like instead of one exact answer:

```json
{ "task": "...", "expectedTools": ["run_tests"], "maxIterations": 5 }
```

`score.ts` checks the trajectory, not the wording of the final answer:

- were the expected tools actually called
- did the agent reach a final answer within its iteration budget

No second LLM call, no judgment calls - deterministic and reproducible.

Every task prints its trajectory, pass or fail. That shows the blind spot:
an agent that reads the file directly instead of calling `search_code` can
find the right answer and still FAIL. Rules measure process, not correctness;
`harness/golden.json` is the other half.

## Run

```bash
pnpm --filter 14-evaluation test:fixture
pnpm --filter 14-evaluation start
```
