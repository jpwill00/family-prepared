import { useParams, Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";

export default function LibraryArticleRoute() {
  const { area, slug } = useParams<{ area: string; slug: string }>();
  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/library" className="hover:text-foreground">Library</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/library/${area}`} className="hover:text-foreground">{area}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{slug}</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-blue-700" />
        <h1 className="text-2xl font-bold text-blue-700">{slug?.replace(/-/g, " ")}</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-sm">Article content requires library files — import the template ZIP.</p>
      </div>
    </div>
  );
}
