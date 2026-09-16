# AI Agents Engineering Workshop

A hands-on workshop repo that teaches AI agent architecture by progressively building one system: an Engineering Agent operating on a bundled sample codebase.

## Language

**Example**:
A folder under `examples/NN-name/` containing the code for one workshop stage. Each example's agent loop and tools are its own copy, duplicated on purpose so the logic that changes stage to stage stays independently readable. The provider/config layer is the one exception: it's shared via the `llm-provider` workspace package (see ADR-0003) since it's identical across every example and has no pedagogical reason to be duplicated.
_Avoid_: stage, step, module (when referring to a workshop folder)

**Fixture Repo**:
The tiny, deliberately-crafted sample codebase (with a known failing test) bundled inside the workshop and used as the target for the Engineering Agent's tools (search_code, read_file, list_files, run_tests, git_diff). Deterministic and identical for every attendee. Themed as a small "Pokédex API" service for memorability — the theme is narrative flavor only; the tools and skills exercised are unchanged plain engineering tools (real code, real tests, real git).
_Avoid_: sandbox, target project, test repo

**Engineering Agent**:
The single running agent instance built up progressively across the examples. Operates exclusively on the Fixture Repo, never on the workshop repo itself or an attendee's own project.
