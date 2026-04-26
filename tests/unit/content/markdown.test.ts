import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/content/markdown";
import { extractFrontmatter } from "@/lib/content/frontmatter";

describe("extractFrontmatter", () => {
  it("parses YAML frontmatter and body", () => {
    const content = `---
title: Bleeding Control
last_reviewed: "2026-01-01"
---
# Body content`;
    const { meta, body } = extractFrontmatter(content);
    expect(meta.title).toBe("Bleeding Control");
    expect(meta.last_reviewed).toBe("2026-01-01");
    expect(body.trim()).toBe("# Body content");
  });

  it("returns empty meta and full content when no frontmatter", () => {
    const content = "# Just a heading\nSome text.";
    const { meta, body } = extractFrontmatter(content);
    expect(meta).toEqual({});
    expect(body).toBe(content);
  });

  it("handles malformed YAML frontmatter gracefully", () => {
    const content = "---\n: invalid: yaml: [[\n---\n# Body";
    const { meta, body } = extractFrontmatter(content);
    expect(meta).toEqual({});
    expect(body.trim()).toBe("# Body");
  });

  it("handles empty frontmatter block", () => {
    const content = "---\n---\n# Body";
    const { meta, body } = extractFrontmatter(content);
    expect(meta).toEqual({});
    expect(body.trim()).toBe("# Body");
  });
});

describe("renderMarkdown", () => {
  it("converts markdown heading to HTML", async () => {
    const html = await renderMarkdown("# Hello World");
    expect(html).toContain("<h1>Hello World</h1>");
  });

  it("converts paragraph to HTML", async () => {
    const html = await renderMarkdown("Apply direct pressure to the wound.");
    expect(html).toContain("<p>Apply direct pressure to the wound.</p>");
  });

  it("strips frontmatter before rendering", async () => {
    const content = `---
title: Test Article
---
# Article Body`;
    const html = await renderMarkdown(content);
    expect(html).not.toContain("title: Test Article");
    expect(html).toContain("<h1>Article Body</h1>");
  });

  it("renders unordered list", async () => {
    const html = await renderMarkdown("- Item one\n- Item two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>Item one</li>");
  });

  it("renders bold text", async () => {
    const html = await renderMarkdown("**Important**");
    expect(html).toContain("<strong>Important</strong>");
  });

  it("handles empty string", async () => {
    const html = await renderMarkdown("");
    expect(html.trim()).toBe("");
  });
});
