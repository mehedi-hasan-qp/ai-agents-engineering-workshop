import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Pre-built for you. This is the plumbing, not the lesson.
//
// It reads an offline snapshot of the public QuestionPro help centre
// (`harness/corpus`), so your homework needs no VPN, no API key for the wiki,
// no auth, no rate limits, and gives every person in the room byte-identical
// results.
//
// Your job across the six sessions is to build the *harness* around this
// client: tools, loop, context, protocol, policy. Do not rewrite this file.

const CORPUS_ROOT = path.resolve(import.meta.dirname, "../corpus");
const PAGES_DIR = path.join(CORPUS_ROOT, "pages");

export interface PageSummary {
  slug: string;
  title: string;
  section: string;
  url: string;
  words: number;
}

export interface SearchHit {
  slug: string;
  title: string;
  section: string;
  line: number;
  text: string;
}

let manifestCache: PageSummary[] | undefined;

export async function listPages(section?: string): Promise<PageSummary[]> {
  manifestCache ??= await loadManifest();

  return section ? manifestCache.filter((page) => page.section === section) : [...manifestCache];
}

async function loadManifest(): Promise<PageSummary[]> {
  const manifestFile = path.join(CORPUS_ROOT, "manifest.json");
  const raw = await readFile(manifestFile, "utf-8");

  try {
    return (JSON.parse(raw) as { pages: PageSummary[] }).pages;
  } catch (error) {
    throw new Error(
      `Corpus manifest at ${manifestFile} is not valid JSON. ` +
        `Restore it with \`git checkout -- harness/corpus\`. (${
          error instanceof Error ? error.message : String(error)
        })`,
    );
  }
}

export async function listSections(): Promise<string[]> {
  const pages = await listPages();
  return [...new Set(pages.map((page) => page.section))].sort((a, b) => a.localeCompare(b));
}

/** Plain substring search over the corpus. No embeddings, on purpose. */
export async function searchDocs(query: string, limit = 20): Promise<SearchHit[]> {
  const pages = await listPages();
  const needle = query.toLowerCase();
  const hits: SearchHit[] = [];

  for (const page of pages) {
    const content = await getPage(page.slug);
    const lines = content.split("\n");

    for (const [index, line] of lines.entries()) {
      if (!line.toLowerCase().includes(needle)) continue;
      hits.push({
        slug: page.slug,
        title: page.title,
        section: page.section,
        line: index + 1,
        text: line.trim(),
      });
      if (hits.length >= limit) return hits;
    }
  }

  return hits;
}

export async function getPage(slug: string): Promise<string> {
  return readFile(pagePath(slug), "utf-8");
}

export async function savePage(slug: string, content: string): Promise<void> {
  await writeFile(pagePath(slug), content, "utf-8");
}

export async function pageExists(slug: string): Promise<boolean> {
  const files = await readdir(PAGES_DIR);
  return files.includes(`${slug}.md`);
}

// Containment check. A slug arriving from a model is untrusted input like any
// other, and "../../.env" is a perfectly valid string.
function pagePath(slug: string): string {
  const resolved = path.resolve(PAGES_DIR, `${slug}.md`);
  if (!resolved.startsWith(PAGES_DIR)) {
    throw new Error(`Slug escapes the corpus: ${slug}`);
  }
  return resolved;
}

export const corpusRoot = CORPUS_ROOT;
