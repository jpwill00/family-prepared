import { PenSquare } from "lucide-react";

export default function CustomIndexRoute() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <PenSquare className="h-5 w-5 text-amber-700" />
        <h1 className="text-2xl font-bold text-amber-700">Custom Content</h1>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <PenSquare className="mx-auto h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium mb-1">No custom content areas yet</p>
        <p className="text-xs max-w-sm mx-auto">
          Custom areas let you write your own guides — for pets, special equipment,
          or neighborhood-specific information. Coming in a future sprint.
        </p>
      </div>
    </div>
  );
}
