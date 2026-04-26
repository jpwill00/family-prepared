import { Link } from "react-router-dom";
import { BookOpen, PackageOpen } from "lucide-react";
import { usePlanStore } from "@/lib/store/plan";
import { AreaCard } from "@/components/library/AreaCard";

export default function LibraryIndexRoute() {
  const repo = usePlanStore((s) => s.repo);
  const listFiles = usePlanStore((s) => s.listFiles);

  const areas = repo?.library_manifest?.content_areas ?? [];

  function articleCount(areaPath: string) {
    return listFiles(`library/${areaPath}/`).filter((p) => p.endsWith(".md")).length;
  }

  if (areas.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-blue-700" />
          <h1 className="text-2xl font-bold text-blue-700">Reference Library</h1>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <PackageOpen className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">No library content loaded</p>
          <p className="text-xs max-w-sm mx-auto mb-4">
            Import the template ZIP to get curated reference articles on first aid,
            water storage, communications, and more.
          </p>
          <Link
            to="/onboarding"
            className="text-xs text-blue-600 hover:underline"
          >
            Go to onboarding to import content →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-blue-700" />
        <h1 className="text-2xl font-bold text-blue-700">Reference Library</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area) => (
          <AreaCard
            key={area.path}
            path={area.path}
            title={area.title}
            articleCount={articleCount(area.path)}
          />
        ))}
      </div>
    </div>
  );
}
