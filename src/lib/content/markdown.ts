import { remark } from "remark";
import remarkHtml from "remark-html";
import { extractFrontmatter } from "@/lib/content/frontmatter";

const processor = remark().use(remarkHtml, { sanitize: false });

export async function renderMarkdown(content: string): Promise<string> {
  const { body } = extractFrontmatter(content);
  const result = await processor.process(body);
  return String(result);
}
