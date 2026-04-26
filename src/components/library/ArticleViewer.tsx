import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, BookOpen } from "lucide-react";

interface ArticleViewerProps {
  html: string;
  meta: Record<string, unknown>;
}

export function ArticleViewer({ html, meta }: ArticleViewerProps) {
  const title = typeof meta.title === "string" ? meta.title : undefined;
  const lastReviewed = typeof meta.last_reviewed === "string" ? meta.last_reviewed : undefined;
  const sources = Array.isArray(meta.sources) ? (meta.sources as string[]) : [];

  return (
    <article className="max-w-2xl">
      {title && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-blue-800">{title}</h1>
          {lastReviewed && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Reviewed {lastReviewed}</span>
            </div>
          )}
        </div>
      )}

      <div
        className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-a:text-blue-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {sources.length > 0 && (
        <>
          <Separator className="my-6" />
          <section className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 mb-2 font-medium">
              <BookOpen className="h-3 w-3" />
              Sources
            </div>
            <ul className="space-y-1 list-none pl-0">
              {sources.map((src, i) => (
                <li key={i}>
                  <Badge variant="outline" className="text-xs font-normal">
                    {src}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </article>
  );
}
