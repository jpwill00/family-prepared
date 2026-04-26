import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { PenSquare, ChevronRight, Copy, Trash2 } from "lucide-react";
import { usePlanStore } from "@/lib/store/plan";
import { MarkdownEditor } from "@/components/custom/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function slugToTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomArticleRoute() {
  const { area, slug } = useParams<{ area: string; slug: string }>();
  const getFile = usePlanStore((s) => s.getFile);
  const setFile = usePlanStore((s) => s.setFile);
  const deleteFile = usePlanStore((s) => s.deleteFile);
  const libraryGetFile = usePlanStore((s) => s.getFile);

  const filePath = `custom/${area}/${slug}.md`;
  const libraryPath = `library/${area}/${slug}.md`;

  const [content, setContent] = useState<string>(() => getFile(filePath) ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset editor content when navigating to a different article
  const prevFilePath = useRef(filePath);
  useEffect(() => {
    if (prevFilePath.current !== filePath) {
      prevFilePath.current = filePath;
    }
  }, [filePath]);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setFile(filePath, value);
      }, 500);
    },
    [filePath, setFile],
  );

  async function handleForkFromLibrary() {
    const libraryContent = libraryGetFile(libraryPath);
    if (!libraryContent) return;
    const forked =
      libraryContent + "\n\n<!-- Forked from library — edit freely -->\n";
    setContent(forked);
    await setFile(filePath, forked);
  }

  async function handleDelete() {
    await deleteFile(filePath);
    window.history.back();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/custom" className="hover:text-foreground">
          Custom
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/custom/${area}`} className="hover:text-foreground">
          {slugToTitle(area ?? "")}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{slugToTitle(slug ?? "")}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PenSquare className="h-5 w-5 text-amber-700" />
          <h1 className="text-2xl font-bold text-amber-700">
            {slugToTitle(slug ?? "")}
          </h1>
        </div>
        <div className="flex gap-2">
          {libraryGetFile(libraryPath) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleForkFromLibrary}
              title="Copy library article here to edit"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Fork from library
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-white"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {content !== null && (
        <div className="flex-1">
          <MarkdownEditor value={content} onChange={handleChange} />
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Auto-saves 500 ms after you stop typing.
      </p>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this article?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{filePath}</code>.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
