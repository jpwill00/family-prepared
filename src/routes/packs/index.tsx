import { useRef, useState } from "react";
import { usePlanStore } from "@/lib/store/plan";
import { importPackFromZip } from "@/lib/packs/import";
import type { InstalledPackEntry } from "@/lib/schemas/plan";
import { Button } from "@/components/ui/button";
import { Archive, Upload, Trash2, AlertCircle } from "lucide-react";

export default function PacksIndexRoute() {
  const installed = usePlanStore((s) => s.repo?.installed_packs.installed ?? []);
  const repo = usePlanStore((s) => s.repo);
  const setRepo = usePlanStore((s) => s.setRepo);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file || !repo) return;
    setError(null);
    setImporting(true);
    try {
      const { manifest } = await importPackFromZip(file);
      const entry: InstalledPackEntry = {
        id: manifest.id,
        version: manifest.version,
        source: "local-import",
        installed_at: new Date().toISOString().slice(0, 10),
      };
      const alreadyInstalled = installed.some((p) => p.id === manifest.id);
      const updatedInstalled = alreadyInstalled
        ? installed.map((p) => (p.id === manifest.id ? entry : p))
        : [...installed, entry];
      await setRepo({
        ...repo,
        installed_packs: { installed: updatedInstalled },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import pack");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove(id: string) {
    if (!repo) return;
    await setRepo({
      ...repo,
      installed_packs: { installed: installed.filter((p) => p.id !== id) },
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-purple-700" />
          <h1 className="text-2xl font-bold text-purple-700">Packs</h1>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            {importing ? "Importing…" : "Import pack"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {installed.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Archive className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">No packs installed</p>
          <p className="text-xs">
            Import a .zip pack to add community guides and checklists.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {installed.map((pack) => (
            <li key={pack.id} className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <Archive className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{pack.id}</p>
                <p className="text-xs text-muted-foreground">
                  v{pack.version} · {pack.source}
                  {pack.installed_at ? ` · installed ${pack.installed_at}` : ""}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleRemove(pack.id)}
                aria-label={`Remove ${pack.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
