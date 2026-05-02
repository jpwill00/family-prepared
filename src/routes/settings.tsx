import { useState, useEffect } from "react";
import { usePlanStore } from "@/lib/store/plan";
import { exportRepoAsZip } from "@/lib/persistence/zip";
import {
  loadSyncMeta,
  clearSyncMeta,
  loadToken,
  hasEncryptedData,
  loadEncryptedFields,
  saveEncryptedFields,
  clearEncryptedFields,
  clearSalt,
} from "@/lib/persistence/idb";
import { revokeToken, getStoredToken, startDeviceFlow, pollForToken } from "@/lib/github/auth";
import { pushRepo, pullRepo, getRepoMeta } from "@/lib/github/sync";
import { saveSyncMeta } from "@/lib/persistence/idb";
import { deriveKey, encrypt, decrypt, getOrCreateSalt } from "@/lib/crypto/secure";
import { fetchSeedLibrary } from "@/lib/library/seed";
import type { SyncMeta } from "@/lib/persistence/idb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Download,
  Trash2,
  AlertCircle,
  Cloud,
  UploadCloud,
  DownloadCloud,
  Unlink,
  CheckCircle2,
  Loader2,
  Lock,
  KeyRound,
  RefreshCw,
  BookOpen,
  ExternalLink,
} from "lucide-react";

export default function SettingsRoute() {
  const repo = usePlanStore((s) => s.repo);
  const setRepo = usePlanStore((s) => s.setRepo);
  const reset = usePlanStore((s) => s.reset);
  const cryptoKey = usePlanStore((s) => s.cryptoKey);
  const setCryptoKey = usePlanStore((s) => s.setCryptoKey);

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

  // Device Flow state for "Set up online backup" initiated from Settings
  type SetupStep =
    | { kind: "idle" }
    | { kind: "waiting"; userCode: string; verificationUri: string }
    | { kind: "polling" }
    | { kind: "repo_input"; token: string }
    | { kind: "syncing" };
  const [setupStep, setSetupStep] = useState<SetupStep>({ kind: "idle" });
  const [setupRepoInput, setSetupRepoInput] = useState("");

  // Library refresh state
  const [refreshingLibrary, setRefreshingLibrary] = useState(false);
  const [libraryRefreshResult, setLibraryRefreshResult] = useState<"success" | "error" | null>(null);
  const [confirmLibraryOverwrite, setConfirmLibraryOverwrite] = useState(false);

  // Passphrase / encryption state
  const [hasEncryption, setHasEncryption] = useState(false);
  const [passphraseMode, setPassphraseMode] = useState<"idle" | "set" | "change">("idle");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [passphraseError, setPassphraseError] = useState<string | null>(null);
  const [passphraseSaving, setPassphraseSaving] = useState(false);
  const [confirmResetEncryption, setConfirmResetEncryption] = useState(false);

  useEffect(() => {
    async function loadGitHubState() {
      const [token, meta, encryptionExists] = await Promise.all([
        loadToken(),
        loadSyncMeta(),
        hasEncryptedData(),
      ]);
      setConnected(!!token);
      setSyncMeta(meta);
      setHasEncryption(encryptionExists);
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
      await saveSyncMeta(updated);
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
      await saveSyncMeta(updated);
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

  async function handleSetupBackup() {
    setError(null);
    try {
      const state = await startDeviceFlow();
      setSetupStep({ kind: "waiting", userCode: state.user_code, verificationUri: state.verification_uri });
      const ac = new AbortController();
      setSetupStep({ kind: "polling" });
      const token = await pollForToken(state, ac.signal);
      if (!token) {
        setSetupStep({ kind: "idle" });
        setError("Authorization timed out or was cancelled.");
        return;
      }
      setSetupStep({ kind: "repo_input", token });
    } catch (err) {
      setSetupStep({ kind: "idle" });
      setError(err instanceof Error ? err.message : "Authorization failed");
    }
  }

  function handleCancelSetup() {
    setSetupStep({ kind: "idle" });
    setSetupRepoInput("");
  }

  async function handleConnectSetupRepo() {
    if (setupStep.kind !== "repo_input") return;
    const { token } = setupStep;
    const nwo = setupRepoInput.trim();
    if (!nwo.includes("/")) {
      setError("Enter the repo as owner/repo-name");
      return;
    }
    setError(null);
    setSetupStep({ kind: "syncing" });
    try {
      const meta = await getRepoMeta(token, nwo);
      const pulled = await pullRepo(token, nwo);
      await setRepo(pulled);
      const newMeta: SyncMeta = {
        lastPullSha: meta.latestSha,
        lastSyncedAt: new Date().toISOString(),
        connectedRepo: nwo,
        connectedUser: meta.login,
      };
      await saveSyncMeta(newMeta);
      setSyncMeta(newMeta);
      setConnected(true);
      setSetupStep({ kind: "idle" });
      setSetupRepoInput("");
    } catch (err) {
      setSetupStep({ kind: "repo_input", token });
      setError(err instanceof Error ? err.message : "Failed to connect to backup");
    }
  }

  async function handleRefreshLibrary() {
    setRefreshingLibrary(true);
    setLibraryRefreshResult(null);
    try {
      const libraryFiles = await fetchSeedLibrary();
      if (!libraryFiles || libraryFiles.size === 0) {
        setLibraryRefreshResult("error");
        return;
      }
      const { mergeFiles } = await import("@/lib/persistence/idb");
      await mergeFiles(libraryFiles);
      usePlanStore.setState((s) => {
        const next = new Map(s.rawFiles);
        for (const [k, v] of libraryFiles) next.set(k, v);
        return { rawFiles: next };
      });
      setLibraryRefreshResult("success");
      setConfirmLibraryOverwrite(false);
      setTimeout(() => setLibraryRefreshResult(null), 4000);
    } catch {
      setLibraryRefreshResult("error");
    } finally {
      setRefreshingLibrary(false);
    }
  }

  async function handleSetPassphrase() {
    if (newPassphrase !== confirmPassphrase) {
      setPassphraseError("Passphrases do not match.");
      return;
    }
    if (newPassphrase.length < 8) {
      setPassphraseError("Passphrase must be at least 8 characters.");
      return;
    }
    setPassphraseError(null);
    setPassphraseSaving(true);
    try {
      const salt = await getOrCreateSalt();
      const key = await deriveKey(newPassphrase, salt);

      // Re-encrypt all currently stored encrypted fields with new key,
      // or if changing passphrase, re-encrypt existing plaintext sentinels.
      if (passphraseMode === "change" && cryptoKey) {
        const existing = await loadEncryptedFields();
        if (existing) {
          const reencrypted: Record<string, { iv: string; ciphertext: string }> = {};
          for (const [fieldId, blob] of Object.entries(existing)) {
            const plain = await decrypt(cryptoKey, blob.iv, blob.ciphertext);
            reencrypted[fieldId] = await encrypt(key, plain);
          }
          await saveEncryptedFields(reencrypted);
        }
      }

      setCryptoKey(key);
      setHasEncryption(true);
      setNewPassphrase("");
      setConfirmPassphrase("");
      setPassphraseMode("idle");
    } catch (err) {
      setPassphraseError(err instanceof Error ? err.message : "Failed to set passphrase");
    } finally {
      setPassphraseSaving(false);
    }
  }

  async function handleResetEncryption() {
    await clearEncryptedFields();
    await clearSalt();
    setCryptoKey(null);
    setHasEncryption(false);
    setConfirmResetEncryption(false);
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
          <h2 className="text-base font-semibold border-b pb-2">Online backup (optional)</h2>
          {!connected ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Back up your plan to a private cloud repository so you can restore it on any device.
              </p>
              {setupStep.kind === "idle" && (
                <Button
                  className="bg-green-700 hover:bg-green-800 text-white"
                  size="sm"
                  onClick={handleSetupBackup}
                >
                  <Cloud className="mr-2 h-4 w-4" />
                  Set up online backup
                </Button>
              )}
              {(setupStep.kind === "waiting" || setupStep.kind === "polling") && (
                <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Authorize backup access</p>
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Your one-time code</p>
                    <p className="text-xl font-mono font-bold tracking-widest">
                      {setupStep.kind === "waiting" ? setupStep.userCode : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        setupStep.kind === "waiting" ? setupStep.verificationUri : "https://github.com/login/device",
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open github.com/login/device
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for authorization…
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={handleCancelSetup}>
                    Cancel
                  </Button>
                </div>
              )}
              {setupStep.kind === "repo_input" && (
                <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Which backup would you like to load?</p>
                  <p className="text-xs text-muted-foreground">
                    Enter the repository name that holds your plan (e.g. <code>yourname/family-plan</code>).
                  </p>
                  <div className="space-y-1">
                    <Label htmlFor="settings-repo-input">Cloud backup name</Label>
                    <input
                      id="settings-repo-input"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      placeholder="owner/repo-name"
                      value={setupRepoInput}
                      onChange={(e) => setSetupRepoInput(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleConnectSetupRepo}
                    disabled={!setupRepoInput.trim()}
                  >
                    Load plan from cloud backup
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full" onClick={handleCancelSetup}>
                    Cancel
                  </Button>
                </div>
              )}
              {setupStep.kind === "syncing" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading plan from cloud backup…
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <Cloud className="h-4 w-4" />
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
                  Save to cloud now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePull}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                  Load latest from cloud
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
                  Turn off online backup
                </Button>
              ) : (
                <div className="rounded-md border border-destructive p-3 space-y-2 text-sm">
                  <p className="font-medium text-destructive">Turn off online backup?</p>
                  <p className="text-muted-foreground">Your local plan data is kept. You can reconnect anytime.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDisconnect(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDisconnect}>
                      Turn off
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">Data protection</h2>
          <p className="text-sm text-muted-foreground">
            Protect sensitive fields (medical info, medications, contact numbers) with a passphrase.
            The key is derived in memory only — never stored.
          </p>

          {passphraseMode === "idle" ? (
            <div className="flex gap-2 flex-wrap">
              {!hasEncryption ? (
                <Button variant="outline" size="sm" onClick={() => setPassphraseMode("set")}>
                  <Lock className="mr-2 h-4 w-4" />
                  Set passphrase
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setPassphraseMode("change")}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change passphrase
                  </Button>
                  {!confirmResetEncryption ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setConfirmResetEncryption(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset encryption
                    </Button>
                  ) : (
                    <div className="rounded-md border border-destructive p-3 space-y-2 text-sm w-full">
                      <p className="font-medium text-destructive">Reset encryption?</p>
                      <p className="text-muted-foreground">
                        All encrypted field data will be permanently deleted. The fields will revert to plaintext.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setConfirmResetEncryption(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleResetEncryption}>
                          Yes, reset encryption
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">
                {passphraseMode === "set" ? "Set a new passphrase" : "Change passphrase"}
              </p>
              {passphraseError && (
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {passphraseError}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="new-passphrase">New passphrase</Label>
                <Input
                  id="new-passphrase"
                  type="password"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-passphrase">Confirm passphrase</Label>
                <Input
                  id="confirm-passphrase"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetPassphrase()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPassphraseMode("idle");
                    setNewPassphrase("");
                    setConfirmPassphrase("");
                    setPassphraseError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSetPassphrase}
                  disabled={passphraseSaving || !newPassphrase}
                >
                  {passphraseSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                  ) : (
                    "Save passphrase"
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">Reference library</h2>
          <p className="text-sm text-muted-foreground">
            Re-fetch the latest reference library articles from the template repository.
            Your custom content is never affected.
          </p>
          {libraryRefreshResult === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Library updated successfully.
            </div>
          )}
          {libraryRefreshResult === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              Could not fetch library. Check your connection and try again.
            </div>
          )}
          {!confirmLibraryOverwrite ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLibraryOverwrite(true)}
              disabled={refreshingLibrary}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Update reference library
            </Button>
          ) : (
            <div className="rounded-md border p-3 space-y-2 text-sm">
              <p className="font-medium">Overwrite library/ content?</p>
              <p className="text-muted-foreground">
                This replaces all files in your reference library with the latest versions.
                Custom content in <code>custom/</code> is not affected.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setConfirmLibraryOverwrite(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRefreshLibrary} disabled={refreshingLibrary}>
                  {refreshingLibrary ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Updating…</>
                  ) : (
                    "Yes, update library"
                  )}
                </Button>
              </div>
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
