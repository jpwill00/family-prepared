import { useState } from "react";
import { usePlanStore } from "@/lib/store/plan";
import { exportRepoAsZip } from "@/lib/persistence/zip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Download, Trash2, AlertCircle } from "lucide-react";

export default function SettingsRoute() {
  const repo = usePlanStore((s) => s.repo);
  const setRepo = usePlanStore((s) => s.setRepo);
  const reset = usePlanStore((s) => s.reset);

  const [planName, setPlanName] = useState(repo?.plan_yaml.name ?? "");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleSaveName() {
    if (!repo) return;
    setSaving(true);
    try {
      await setRepo({ ...repo, plan_yaml: { ...repo.plan_yaml, name: planName.trim() || repo.plan_yaml.name } });
    } finally {
      setSaving(false);
    }
  }

  async function handleExportZip() {
    if (!repo) return;
    setError(null);
    setExporting(true);
    try {
      const blob = await exportRepoAsZip(repo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (repo.plan_yaml.name ?? "family-plan").replace(/[^a-z0-9]/gi, "-").toLowerCase();
      a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export ZIP backup");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    if (!repo) return;
    setError(null);
    setExportingPdf(true);
    try {
      const { exportPdf } = await import("@/lib/persistence/pdf");
      const blob = await exportPdf(repo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (repo.plan_yaml.name ?? "family-plan").replace(/[^a-z0-9]/gi, "-").toLowerCase();
      a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleReset() {
    await reset();
    setConfirmReset(false);
    window.location.href = "/onboarding";
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="max-w-lg space-y-8">
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">Plan settings</h2>
          <div className="space-y-1">
            <Label htmlFor="plan-name">Plan name</Label>
            <div className="flex gap-2">
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <Button onClick={handleSaveName} disabled={saving} variant="outline">
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">Backup & export</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Download a complete backup of your plan as a ZIP file. Use this to
              transfer between devices or keep an offline copy.
            </p>
            <Button
              variant="outline"
              onClick={handleExportZip}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting…" : "Export ZIP backup"}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Download a print-ready emergency binder PDF with all plan sections.
            </p>
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={exportingPdf}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportingPdf ? "Generating PDF…" : "Export PDF binder"}
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2 text-destructive">Danger zone</h2>
          {!confirmReset ? (
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-white"
              onClick={() => setConfirmReset(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset all data
            </Button>
          ) : (
            <div className="rounded-md border border-destructive p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                This will permanently delete all your plan data. Export a backup first.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReset}
                >
                  Yes, delete everything
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
