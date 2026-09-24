// ---------------------------------------------------------------------------
// SESSION 1 HOMEWORK: your first tool.
//
// Right now src/index.ts searches the corpus itself and pastes the hits into
// the prompt. The model never decides anything - that is not an agent.
//
// Goal: the MODEL asks for the search, YOUR CODE runs it, and the model
// answers from what you sent back. Same shape as examples/02-tool-calling.
//
// This file holds the tool. src/index.ts will use it (step 5).
// Reference: examples/02-tool-calling/src/tools.ts and src/index.ts
// ---------------------------------------------------------------------------

// STEP 1 - Imports.
//   You need two things:
//   - the `ToolSchema` type from "llm-provider/provider"
//   - `searchDocs` from "./wikiClient.ts" (already built; do not rewrite it)

// STEP 2 - Describe the tool to the model: a ToolSchema.
//   It has three fields:
//   - name:        what the model calls it, e.g. "search_docs"
//   - description: WHAT it does and WHAT it returns. The model reads this on
//                  every call to decide whether and how to use the tool, so
//                  it is prompt, not a comment. Say it searches the
//                  QuestionPro help centre, that matching is an exact
//                  phrase (case-insensitive), and what the result lines look
//                  like. `pnpm verify` fails anything under 20 characters.
//   - parameters:  a JSON Schema for the arguments. One required string,
//                  `query`, with its own short description.
//   Hint: search_code in examples/02 has exactly this shape.

// STEP 3 - Write the function that runs when the model asks.
//   It receives the model's arguments and must return a Promise<string>.
//   - Check the argument. Do not trust it: the model can send malformed JSON,
//     and then the arguments arrive as {}. If `query` is not a non-empty
//     string, return an error message - do not throw, do not crash.
//   - Call searchDocs(query). It returns SearchHit[] objects
//     ({ slug, title, section, line, text }).
//   - Turn the hits into TEXT, one line per hit, e.g. `slug:line: text`.
//     The model reads text; an array of objects is not something it can read.
//   - Zero hits? Return a message that says so and suggests a shorter or
//     different phrase. An empty string tells the model nothing.

// STEP 4 - Export the tools array. `pnpm verify` looks for exactly this name.
//   export const tools = [ { schema, kind, run } ];
//   - schema: your ToolSchema from step 2
//   - kind:   "read"  - it only reads. Classify it now; session 3's policy
//             depends on it, and verify checks it as soon as this file exports
//             `tools`.
//   - run:    your function from step 3
//   Keep this file free of side effects: no model calls, no console.log at
//   the top level. `pnpm verify` imports it, and must stay offline and free.

// STEP 5 - Use the tool from src/index.ts (that file, not this one).
//   Replace the "search, then paste hits into the prompt" part with two calls:
//   a. First call: send the question WITH tools: tools.map((t) => t.schema).
//      The system prompt should say: answer only from the help centre, search
//      first, and say "I don't know" if the search finds nothing.
//   b. No toolCalls in the response? Print the text and stop.
//   c. Otherwise push the assistant message, then for EVERY entry in
//      toolCalls: find the tool by name, run it, and push
//      { role: "tool", content: result, toolCallId: call.id }.
//      One response can ask for several calls - each needs its own answer,
//      or the next request is rejected.
//   d. Second call with the full messages array. Print the answer.
//   If the second response asks for yet another tool instead of answering,
//   that is not your bug: it needs the loop you build in session 2.

// STEP 6 - Check your work.
//   pnpm verify                 -> the session 1 checks say PASS
//   pnpm harness                -> prints an answer
//   LLM_DEBUG=1 pnpm harness    -> read the requests: the second one re-sends
//                                  everything, plus your tool result
//   Then ask something the help centre does not cover. If the model still
//   answers confidently, tighten your system prompt.
//
// DONE WHEN: verify passes session 1; the model's tool call really runs; the
// answer changes with what your search returned.
//
// A 429 "rate limited, retrying" line is the shared provider recovering on
// its own. Don't work around it - screenshot it for session 2.
// Timebox: 90 minutes. Stuck? Ask your pair, then bring it to the session.
