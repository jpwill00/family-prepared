import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface AreaCardProps {
  path: string;
  title: string;
  icon?: string;
  articleCount: number;
}

export function AreaCard({ path, title, icon, articleCount }: AreaCardProps) {
  return (
    <Link to={`/library/${path}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">
              {icon ?? <BookOpen className="h-6 w-6 text-blue-600" />}
            </span>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {articleCount} {articleCount === 1 ? "article" : "articles"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
