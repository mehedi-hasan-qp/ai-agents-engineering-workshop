// Fetches a fixed subset of the public QuestionPro help centre and writes it
// to harness/corpus as markdown.
//
// Run once, commit the result. Attendees never run this: the committed corpus
// is what makes their homework offline, deterministic, and identical to
// everyone else's. Regenerating it mid-workshop would invalidate the golden
// question set, so don't.
//
//   pnpm snapshot
//
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITEMAP = "https://www.questionpro.com/en/sitemap/help.xml";
const OUT_DIR = path.resolve(import.meta.dirname, "../harness/corpus");
const PAGES_PER_SECTION = 14;
const CONCURRENCY = 6;

interface Page {
  url: string;
  slug: string;
  section: string;
  title: string;
  words: number;
}

const sitemap = await (await fetch(SITEMAP)).text();
const urls = [...sitemap.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)]
  .map((match) => match[1] as string)
  .filter((url) => url.includes("/help/"));

// Deterministic selection: group by help section, sort, take a fixed slice.
// Same corpus for every attendee, on any machine, in any month.
const bySection = new Map<string, string[]>();
for (const url of urls.sort()) {
  const rest = url.split("/help/")[1] ?? "";
  const section = rest.includes("/") ? (rest.split("/")[0] as string) : "general";
  const list = bySection.get(section) ?? [];
  list.push(url);
  bySection.set(section, list);
}

const selected = [...bySection.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([, list]) => list.slice(0, PAGES_PER_SECTION));

console.log(`sitemap: ${urls.length} pages, selected ${selected.length}`);

await mkdir(path.join(OUT_DIR, "pages"), { recursive: true });

const pages: Page[] = [];
let done = 0;

async function worker(queue: string[]): Promise<void> {
  for (;;) {
    const url = queue.pop();
    if (!url) return;

    try {
      const page = await snapshot(url);
      if (page) pages.push(page);
    } catch (error) {
      console.warn(`skip ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }

    done++;
    if (done % 25 === 0) console.log(`  ${done}/${selected.length}`);
  }
}

async function snapshot(url: string): Promise<Page | undefined> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) return undefined;

  const html = await response.text();
  const title = extractTitle(html) ?? slugOf(url);
  const body = extractBody(html);
  if (body.split(/\s+/).length < 40) return undefined;

  const rest = url.split("/help/")[1] ?? "";
  const section = rest.includes("/") ? (rest.split("/")[0] as string) : "general";
  const slug = slugOf(url);
  const markdown = `# ${title}\n\n<!-- source: ${url} -->\n\n${body}\n`;

  await writeFile(path.join(OUT_DIR, "pages", `${slug}.md`), markdown, "utf-8");
  return { url, slug, section, title, words: body.split(/\s+/).length };
}

function slugOf(url: string): string {
  return (url.split("/help/")[1] ?? url)
    .replace(/\.html?$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function extractTitle(html: string): string | undefined {
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
  const fallback = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const raw = heading ?? fallback;
  const text = raw ? clean(raw) : "";
  return text ? text.replace(/\s*\|\s*QuestionPro.*$/i, "").trim() : undefined;
}

// The help centre wraps every content block in `.help-custom-row`. Pulling
// those out drops navigation, banners, and the footer without needing a
// full HTML parser.
function extractBody(html: string): string {
  const blocks = [...html.matchAll(/<div[^>]*class="[^"]*help-custom-row[^"]*"[^>]*>/gi)]
    .map((match) => sliceBalancedDiv(html, match.index))
    .filter((block): block is string => Boolean(block));

  const seen = new Set<string>();
  const parts: string[] = [];

  for (const block of blocks) {
    const markdown = toMarkdown(block);
    if (!markdown || seen.has(markdown)) continue;
    seen.add(markdown);
    parts.push(markdown);
  }

  return parts
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Walks <div>/</div> pairs from an opening tag to find its matching close,
// so nested markup comes along and sibling sections don't.
function sliceBalancedDiv(html: string, start: number): string | undefined {
  const tag = /<\/?div\b[^>]*>/gi;
  tag.lastIndex = start;

  let depth = 0;
  for (let match = tag.exec(html); match; match = tag.exec(html)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index + match[0].length);
  }
  return undefined;
}

function toMarkdown(block: string): string {
  return clean(
    block
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => {
        const body = clean(text);
        return body ? `\n\n${"#".repeat(Math.min(Number(level) + 1, 6))} ${body}\n\n` : "";
      })
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text: string) => {
        const body = clean(text);
        return body ? `\n- ${body}` : "";
      })
      .replace(/<\/(p|div|tr|table|ul|ol|section)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<td[^>]*>/gi, " | "),
  );
}

function clean(text: string): string {
  return decodeEntities(text.replace(/<[^>]+>/g, " "))
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    rsquo: "\u2019",
    lsquo: "\u2018",
    rdquo: "\u201d",
    ldquo: "\u201c",
    mdash: "\u2014",
    ndash: "\u2013",
    hellip: "\u2026",
  };

  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

const queue = [...selected].reverse();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

pages.sort((a, b) => a.slug.localeCompare(b.slug));

await writeFile(
  path.join(OUT_DIR, "manifest.json"),
  `${JSON.stringify(
    {
      source: "https://www.questionpro.com/help",
      capturedAt: new Date().toISOString().slice(0, 10),
      pages: pages.map(({ url, slug, section, title, words }) => ({
        slug,
        title,
        section,
        url,
        words,
      })),
    },
    null,
    2,
  )}\n`,
  "utf-8",
);

console.log(`wrote ${pages.length} pages to ${path.relative(process.cwd(), OUT_DIR)}`);
