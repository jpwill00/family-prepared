import { useState, useEffect } from "react";
import { usePlanStore } from "@/lib/store/plan";
import { exportRepoAsZip } from "@/lib/persistence/zip";
import { loadSyncMeta, clearSyncMeta, loadToken } from "@/lib/persistence/idb";
import { revokeToken, getStoredToken } from "@/lib/github/auth";
import { pushRepo, pullRepo, getRepoMeta } from "@/lib/github/sync";
import type { SyncMeta } from "@/lib/persistence/idb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Download,
  Trash2,
  AlertCircle,
  GitBranch,
  UploadCloud,
  DownloadCloud,
  Unlink,
  CheckCircle2,
  Loader2,
} from "lucide-react";

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

  // GitHub sync state
  const [syncMeta, setSyncMeta] = useState<SyncMeta | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    async function loadGitHubState() {
      const [token, meta] = await Promise.all([loadToken(), loadSyncMeta()]);
      setConnected(!!token);
      setSyncMeta(meta);
    }
    void loadGitHubState();
  }, []);

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

  async function handlePush() {
    if (!repo || !syncMeta) return;
    const token = await getStoredToken();
    if (!token) return;
    setError(null);
    setSyncing(true);
    setSyncSuccess(false);
    try {
      const sha = await pushRepo(token, syncMeta.connectedRepo, repo);
      const updated: SyncMeta = {
        ...syncMeta,
        lastPullSha: sha,
        lastSyncedAt: new Date().toISOString(),
      };
      await import("@/lib/persistence/idb").then((m) => m.saveSyncMeta(updated));
      setSyncMeta(updated);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handlePull() {
    if (!syncMeta) return;
    const token = await getStoredToken();
    if (!token) return;
    setError(null);
    setSyncing(true);
    setSyncSuccess(false);
    try {
      const meta = await getRepoMeta(token, syncMeta.connectedRepo);
      const pulled = await pullRepo(token, syncMeta.connectedRepo);
      await setRepo(pulled);
      const updated: SyncMeta = {
        ...syncMeta,
        lastPullSha: meta.latestSha,
        lastSyncedAt: new Date().toISOString(),
      };
      await import("@/lib/persistence/idb").then((m) => m.saveSyncMeta(updated));
      setSyncMeta(updated);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pull failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await revokeToken();
    await clearSyncMeta();
    setConnected(false);
    setSyncMeta(null);
    setConfirmDisconnect(false);
  }

  const lastSynced = syncMeta?.lastSyncedAt
    ? new Date(syncMeta.lastSyncedAt).toLocaleString()
    : null;

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
          <h2 className="text-base font-semibold border-b pb-2">GitHub sync</h2>
          {!connected ? (
            <p className="text-sm text-muted-foreground">
              Not connected. Use <strong>Connect to GitHub</strong> on the onboarding screen to link a repository.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <GitBranch className="h-4 w-4" />
                  {syncMeta?.connectedRepo ?? "Connected"}
                  {syncMeta?.connectedUser && (
                    <span className="text-muted-foreground font-normal">({syncMeta.connectedUser})</span>
                  )}
                </div>
                {lastSynced && (
                  <p className="text-muted-foreground text-xs">Last synced: {lastSynced}</p>
                )}
                {syncSuccess && (
                  <div className="flex items-center gap-1 text-green-700 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Sync complete
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePush}
                  disabled={syncing || !repo}
                >
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                  Push to GitHub
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePull}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                  Pull from GitHub
                </Button>
              </div>

              {!confirmDisconnect ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setConfirmDisconnect(true)}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              ) : (
                <div className="rounded-md border border-destructive p-3 space-y-2 text-sm">
                  <p className="font-medium text-destructive">Disconnect from GitHub?</p>
                  <p className="text-muted-foreground">Your local plan data is kept. You can reconnect anytime.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDisconnect(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
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
