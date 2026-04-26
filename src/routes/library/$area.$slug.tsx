import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePlanStore } from "@/lib/store/plan";
import { renderMarkdown } from "@/lib/content/markdown";
import { extractFrontmatter } from "@/lib/content/frontmatter";
import { ArticleViewer } from "@/components/library/ArticleViewer";
import { BookOpen, ChevronRight, FileQuestion } from "lucide-react";

export default function LibraryArticleRoute() {
  const { area, slug } = useParams<{ area: string; slug: string }>();
  const getFile = usePlanStore((s) => s.getFile);
  const manifest = usePlanStore((s) => s.repo?.library_manifest);

  const filePath = `library/${area}/${slug}.md`;
  const raw = getFile(filePath);
  const notFound = !raw;
  const { meta, body } = raw ? extractFrontmatter(raw) : { meta: {}, body: "" };

  const [html, setHtml] = useState<string | null>(null);
  const contentArea = manifest?.content_areas.find((a) => a.path === area);

  useEffect(() => {
    if (!body) return;
    let cancelled = false;
    renderMarkdown(body).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => { cancelled = true; };
  }, [body]);

  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/library" className="hover:text-foreground">
          Library
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/library/${area}`} className="hover:text-foreground">
          {contentArea?.title ?? area}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{slug?.replace(/-/g, " ")}</span>
      </div>

      {notFound ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <FileQuestion className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">Article not found</p>
          <p className="text-xs">
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              library/{area}/{slug}.md
            </code>{" "}
            is not in your plan.
          </p>
        </div>
      ) : html === null ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <ArticleViewer html={html} meta={meta} />
      )}
    </div>
  );
}
