# AI Agents Engineering Workshop

A hands-on workshop repo that teaches AI agent architecture by progressively building one system: an Engineering Agent operating on a bundled sample codebase.

## Language

**Example**:
A standalone, self-contained folder under `examples/NN-name/` containing its own runnable copy of the code needed for that workshop stage. Examples do not import from a shared `src/`; each one duplicates whatever prior-stage code it needs so it stays independently runnable.
_Avoid_: stage, step, module (when referring to a workshop folder)

**Fixture Repo**:
The tiny, deliberately-crafted sample codebase (with a known failing test) bundled inside the workshop and used as the target for the Engineering Agent's tools (search_code, read_file, list_files, run_tests, git_diff). Deterministic and identical for every attendee. Themed as a small "Pokédex API" service for memorability — the theme is narrative flavor only; the tools and skills exercised are unchanged plain engineering tools (real code, real tests, real git).
_Avoid_: sandbox, target project, test repo

**Engineering Agent**:
The single running agent instance built up progressively across the examples. Operates exclusively on the Fixture Repo, never on the workshop repo itself or an attendee's own project.
