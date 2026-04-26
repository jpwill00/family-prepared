import { useParams, Link } from "react-router-dom";
import { usePlanStore } from "@/lib/store/plan";
import { BookOpen, ChevronRight } from "lucide-react";

export default function LibraryAreaRoute() {
  const { area } = useParams<{ area: string }>();
  const manifest = usePlanStore((s) => s.repo?.library_manifest);
  const contentArea = manifest?.content_areas.find((a) => a.path === area);

  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/library" className="hover:text-foreground">Library</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{contentArea?.title ?? area}</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-blue-700" />
        <h1 className="text-2xl font-bold text-blue-700">
          {contentArea?.title ?? area}
        </h1>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">
          Article viewer requires library content — import the template ZIP to add guides.
        </p>
      </div>
    </div>
  );
}
