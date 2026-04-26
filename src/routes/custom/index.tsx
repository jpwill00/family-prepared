import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PenSquare, Plus, ChevronRight, FileText } from "lucide-react";
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

export default function CustomIndexRoute() {
  const listFiles = usePlanStore((s) => s.listFiles);
  const setFile = usePlanStore((s) => s.setFile);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [areaName, setAreaName] = useState("");

  const allCustomFiles = listFiles("custom/");
  const areas = [
    ...new Set(
      allCustomFiles
        .map((p) => p.replace(/^custom\//, "").split("/")[0])
        .filter(Boolean),
    ),
  ].sort();

  function articleCount(area: string) {
    return listFiles(`custom/${area}/`).filter((p) => p.endsWith(".md")).length;
  }

  async function handleCreate() {
    const slug = slugify(areaName);
    if (!slug) return;
    const metaPath = `custom/${slug}/_meta.yaml`;
    await setFile(metaPath, `title: ${areaName}\ncontent_type: article_collection\n`);
    setOpen(false);
    setAreaName("");
    navigate(`/custom/${slug}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PenSquare className="h-5 w-5 text-amber-700" />
          <h1 className="text-2xl font-bold text-amber-700">Custom Content</h1>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New area
        </Button>
      </div>

      {areas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <PenSquare className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">No custom content areas yet</p>
          <p className="text-xs max-w-sm mx-auto">
            Create areas to write your own guides — for pets, special equipment,
            or neighborhood-specific information.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {areas.map((area) => (
            <li key={area}>
              <Link
                to={`/custom/${area}`}
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{slugToTitle(area)}</p>
                  <p className="text-xs text-muted-foreground">
                    {articleCount(area)} {articleCount(area) === 1 ? "article" : "articles"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New content area</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="area-name">Area name</Label>
              <Input
                id="area-name"
                autoFocus
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Pets, Ham Radio, Elderly Care"
              />
              {areaName && (
                <p className="text-xs text-muted-foreground">
                  Saved as <code>custom/{slugify(areaName)}/</code>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!slugify(areaName)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
