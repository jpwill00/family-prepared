import { useParams, Link } from "react-router-dom";
import { PenSquare, ChevronRight } from "lucide-react";

export default function CustomArticleRoute() {
  const { area, slug } = useParams<{ area: string; slug: string }>();
  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/custom" className="hover:text-foreground">Custom</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/custom/${area}`} className="hover:text-foreground">{area}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{slug}</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <PenSquare className="h-5 w-5 text-amber-700" />
        <h1 className="text-2xl font-bold text-amber-700">{slug?.replace(/-/g, " ")}</h1>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-sm">Markdown editor coming soon.</p>
      </div>
    </div>
  );
}
