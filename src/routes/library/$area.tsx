import { useParams, Link } from "react-router-dom";
import { usePlanStore } from "@/lib/store/plan";
import { BookOpen, ChevronRight, FileText } from "lucide-react";

function slugToTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LibraryAreaRoute() {
  const { area } = useParams<{ area: string }>();
  const manifest = usePlanStore((s) => s.repo?.library_manifest);
  const listFiles = usePlanStore((s) => s.listFiles);

  const contentArea = manifest?.content_areas.find((a) => a.path === area);
  const articles = listFiles(`library/${area}/`).filter(
    (p) => p.endsWith(".md") && !p.endsWith("_meta.yaml"),
  );

  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/library" className="hover:text-foreground">
          Library
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{contentArea?.title ?? area}</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-blue-700" />
        <h1 className="text-2xl font-bold text-blue-700">
          {contentArea?.title ?? slugToTitle(area ?? "")}
        </h1>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No articles in this area yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {articles.map((filePath) => {
            const slug = filePath
              .replace(`library/${area}/`, "")
              .replace(/\.md$/, "");
            return (
              <li key={filePath}>
                <Link
                  to={`/library/${area}/${slug}`}
                  className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-medium">{slugToTitle(slug)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
