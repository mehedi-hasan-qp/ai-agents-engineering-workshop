import { loadConfig } from "llm-provider/config";
import { OpenAICompatibleProvider } from "llm-provider/provider";
import { listPages, listSections, searchDocs } from "./wikiClient.ts";

// ---------------------------------------------------------------------------
// YOUR HARNESS STARTS HERE.
//
// Right now this is not an agent. It calls the model once and prints the
// answer, exactly like example 01. Over six sessions you will grow it into a
// harness that searches the QuestionPro help corpus, reads pages, edits them,
// compacts its own context, resumes, and exposes itself over MCP.
//
// Assignments, and how to know you are done: harness/README.md
// Reference implementation for every stage:  examples/
// Check your work:                           pnpm verify
// Score your harness:                        pnpm golden
// ---------------------------------------------------------------------------

const provider = new OpenAICompatibleProvider(loadConfig());

const pages = await listPages();
const sections = await listSections();
console.log(`corpus: ${pages.length} pages across ${sections.length} sections\n`);

// Session 1: delete this, and make the model reach the corpus through a tool
// call instead of being handed the answer in the prompt.
const hits = await searchDocs("incidence rate", 5);

const response = await provider.chat({
  messages: [
    {
      role: "system",
      content: "You answer questions about QuestionPro using the QuestionPro help centre.",
    },
    {
      role: "user",
      content: `Using only these search hits, what is an incidence rate?\n\n${hits
        .map((hit) => `${hit.slug}:${hit.line}: ${hit.text}`)
        .join("\n")}`,
    },
  ],
});

console.log(response.message.content);
