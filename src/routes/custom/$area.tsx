import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PenSquare, ChevronRight, Plus, FileText } from "lucide-react";
import { usePlanStore } from "@/lib/store/plan";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugToTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomAreaRoute() {
  const { area } = useParams<{ area: string }>();
  const listFiles = usePlanStore((s) => s.listFiles);
  const setFile = usePlanStore((s) => s.setFile);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");

  const articles = listFiles(`custom/${area}/`).filter(
    (p) => p.endsWith(".md"),
  );

  async function handleCreate() {
    const slug = slugify(articleTitle);
    if (!slug || !area) return;
    const path = `custom/${area}/${slug}.md`;
    const frontmatter = `---\ntitle: ${articleTitle}\n---\n\n`;
    await setFile(path, frontmatter);
    setOpen(false);
    setArticleTitle("");
    navigate(`/custom/${area}/${slug}`);
  }

  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/custom" className="hover:text-foreground">
          Custom
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{slugToTitle(area ?? "")}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PenSquare className="h-5 w-5 text-amber-700" />
          <h1 className="text-2xl font-bold text-amber-700">
            {slugToTitle(area ?? "")}
          </h1>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New article
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <PenSquare className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No articles yet — create one to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {articles.map((filePath) => {
            const slug = filePath
              .replace(`custom/${area}/`, "")
              .replace(/\.md$/, "");
            return (
              <li key={filePath}>
                <Link
                  to={`/custom/${area}/${slug}`}
                  className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-sm font-medium">{slugToTitle(slug)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New article</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                autoFocus
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Evacuation checklist for our cat"
              />
              {articleTitle && (
                <p className="text-xs text-muted-foreground">
                  Saved as{" "}
                  <code>
                    custom/{area}/{slugify(articleTitle)}.md
                  </code>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!slugify(articleTitle)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
