import { Link } from "react-router-dom";
import { usePlanStore } from "@/lib/store/plan";
import { BookOpen, ChevronRight } from "lucide-react";

export default function LibraryIndexRoute() {
  const manifest = usePlanStore((s) => s.repo?.library_manifest);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-blue-700" />
        <h1 className="text-2xl font-bold text-blue-700">Reference Library</h1>
      </div>

      {!manifest || manifest.content_areas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">No library content installed</p>
          <p className="text-xs">
            Import the official template ZIP to add curated guides for first aid,
            evacuation, water safety, and more.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {manifest.content_areas.map((area) => (
            <li key={area.path}>
              <Link
                to={`/library/${area.path}`}
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{area.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {area.content_type.replace(/_/g, " ")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
