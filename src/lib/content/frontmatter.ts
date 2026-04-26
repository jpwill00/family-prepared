import yaml from "js-yaml";

export interface FrontmatterResult {
  meta: Record<string, unknown>;
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?\r?\n?)---\r?\n?/;

export function extractFrontmatter(content: string): FrontmatterResult {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) return { meta: {}, body: content };

  let meta: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(match[1]);
    if (parsed && typeof parsed === "object") {
      meta = parsed as Record<string, unknown>;
    }
  } catch {
    // malformed frontmatter — treat as no frontmatter
  }

  return { meta, body: content.slice(match[0].length) };
}
