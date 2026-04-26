import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdown } from "@/lib/content/markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    let cancelled = false;
    renderMarkdown(value).then((html) => {
      if (!cancelled) setPreview(html);
    });
    return () => { cancelled = true; };
  }, [value]);

  return (
    <div className="grid grid-cols-2 gap-4 h-full min-h-[400px]">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Markdown
        </p>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 resize-none font-mono text-sm h-full min-h-[380px]"
          placeholder="Write your content in Markdown…"
          spellCheck
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Preview
        </p>
        <div className="flex-1 rounded-md border bg-background p-4 overflow-auto min-h-[380px]">
          {preview ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Preview will appear here…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
