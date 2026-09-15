# Production Architecture

```text
                    User
                      |
                      v
               Application API
                      |
                      v
                 Agent Runtime
                      |
        +-------------+-------------+
        v             v             v
      Model         State         Policy
        |
        v
     Tool Layer
        |
   +----+----+
   v    v    v
  MCP  APIs  DB
        |
        v
   External Systems

        +
   Observability
        +
    Evaluation
        +
      Security
```

## Where things live

**Agent Runtime** - owns the loop (Example 03): call the model, execute
what it asks for, feed the result back. Everything else in this document
is something the runtime coordinates, not something it does itself.

**Model** - stateless. Given the same messages and tools, it returns a
response. All memory of a run lives in the messages the runtime sends it,
not in the model.

**State** (Example 04) - split into conversation history (what the model
sees, costs tokens) and agent state (iteration counts, budgets - never
sent to the model). Production systems add a third layer: state that
outlives a single run (user preferences, prior run summaries), usually in
a database the runtime reads from before the first call.

**Policy** (Example 09) - decides what a tool call is allowed to do before
it runs: automatic, needs approval, or blocked. Sits between the runtime
and the tool layer, not inside individual tools - so the policy can change
without touching tool code.

**Tool Layer** (Examples 02, 05) - the boundary where the model's intent
becomes a real side effect. Tools are narrow, typed, and classified
(read/write/execute) so the policy layer has something to act on.

**MCP** (Example 06) - one way tools reach the tool layer: instead of the
runtime importing every integration directly, it speaks one protocol to
any number of MCP servers. Not the only way tools are exposed - plain
function calls and direct API clients still work - but the option to
decouple runtime from implementation when a tool is shared, remote, or
third-party.

**Sub-agents and multi-agent** (Examples 07, 08) - a way of structuring
the Model + Tool Layer relationship, not a separate box in this diagram.
A sub-agent is a full runtime instance, called from inside a tool.

**Observability** (Example 11) - every LLM call and tool call the runtime
makes gets traced. This is what makes "why did the agent do that"
answerable after the fact.

**Evaluation** (Example 12) - runs the same runtime against a fixed
dataset of tasks and scores the trajectory, not just the final answer.
What tells you a change to the runtime, tools, or prompt made things
better or worse.

**Security** (Example 09) - not a layer so much as a property of every
other layer: least-privilege tools, a policy that gates dangerous calls,
and treating tool output as untrusted content the model might be
manipulated by (prompt injection).

## Final mental model

```text
The model provides intelligence; the runtime provides agency.
The tools provide capabilities; protocols provide interoperability;
state provides continuity; policies provide control;
evaluation provides confidence.
```
