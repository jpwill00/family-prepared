import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/lib/store/plan";
import { RepoSchema } from "@/lib/schemas/plan";
import { importRepoFromZip } from "@/lib/persistence/zip";
import { mergeFiles, saveSyncMeta } from "@/lib/persistence/idb";
import { startDeviceFlow, pollForToken } from "@/lib/github/auth";
import { getRepoMeta, pullRepo, createPlanRepo, getSuggestedRepoName, pushRepo } from "@/lib/github/sync";
import { fetchSeedLibrary } from "@/lib/library/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Upload, Cloud, AlertCircle, ExternalLink, Loader2 } from "lucide-react";

type GitHubStep =
  | { kind: "idle" }
  | { kind: "waiting"; userCode: string; verificationUri: string }
  | { kind: "polling" }
  | { kind: "repo_choice"; token: string; suggestedName: string }
  | { kind: "creating_repo" }
  | { kind: "repo_input"; token: string }
  | { kind: "syncing" };

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const setRepo = usePlanStore((s) => s.setRepo);
  const initialized = usePlanStore((s) => s.initialized);
  const repo = usePlanStore((s) => s.repo);

  const [planName, setPlanName] = useState("My Family Plan");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [ghStep, setGhStep] = useState<GitHubStep>({ kind: "idle" });
  const [repoInput, setRepoInput] = useState("");
  const [repoNameInput, setRepoNameInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleStartFresh() {
    const base = repo ?? RepoSchema.parse({});
    await setRepo({
      ...base,
      plan_yaml: { ...base.plan_yaml, name: planName.trim() || "My Family Plan" },
    });
    // Seed the reference library — tries remote release, falls back to bundled
    try {
      const libraryFiles = await fetchSeedLibrary();
      if (libraryFiles && libraryFiles.size > 0) {
        await mergeFiles(libraryFiles);
        usePlanStore.setState((s) => {
          const next = new Map(s.rawFiles);
          for (const [k, v] of libraryFiles) next.set(k, v);
          return { rawFiles: next };
        });
      }
    } catch {
      // Seed library is best-effort — don't block onboarding if it fails
    }
    navigate("/plan/household", { replace: true });
  }

  async function handleImportZip(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImporting(true);
    try {
      const imported = await importRepoFromZip(file);
      await setRepo(imported);
      window.location.href = "/plan/household";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import backup");
    } finally {
      setImporting(false);
    }
  }

  async function handleConnectGitHub() {
    setError(null);
    try {
      const state = await startDeviceFlow();
      setGhStep({ kind: "waiting", userCode: state.user_code, verificationUri: state.verification_uri });

      const ac = new AbortController();
      abortRef.current = ac;
      setGhStep({ kind: "polling" });

      const token = await pollForToken(state, ac.signal);
      if (!token) {
        setGhStep({ kind: "idle" });
        setError("GitHub authorization timed out or was cancelled.");
        return;
      }
      // Fetch suggested repo name while user sees the authorized state
      const suggestedName = await getSuggestedRepoName(token).catch(() => "family-prepared-data");
      setRepoNameInput(suggestedName);
      setGhStep({ kind: "repo_choice", token, suggestedName });
    } catch (err) {
      setGhStep({ kind: "idle" });
      setError(err instanceof Error ? err.message : "GitHub authorization failed");
    }
  }

  function handleCancelGitHub() {
    abortRef.current?.abort();
    setGhStep({ kind: "idle" });
  }

  async function handleCreateRepo() {
    if (ghStep.kind !== "repo_choice") return;
    const { token } = ghStep;
    const name = repoNameInput.trim();
    if (!name) return;
    setError(null);
    setGhStep({ kind: "creating_repo" });
    try {
      const meta = await createPlanRepo(token, name);
      const nwo = `${meta.owner}/${meta.repo}`;
      // Seed the new repo with the current local plan
      const currentRepo = usePlanStore.getState().repo;
      if (currentRepo) {
        await pushRepo(token, nwo, currentRepo, "chore: initial plan from Family Prepared");
      }
      await saveSyncMeta({
        lastPullSha: meta.latestSha,
        lastSyncedAt: new Date().toISOString(),
        connectedRepo: nwo,
        connectedUser: meta.login,
      });
      navigate("/plan/household", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create backup repository";
      if (msg.startsWith("REPO_EXISTS:")) {
        const nwo = msg.replace("REPO_EXISTS:", "");
        setError(`You already have a backup named "${nwo.split("/")[1]}" — use it below, or pick a new name.`);
        setGhStep({ kind: "repo_choice", token, suggestedName: ghStep.suggestedName });
      } else {
        setGhStep({ kind: "repo_choice", token, suggestedName: ghStep.suggestedName });
        setError(msg);
      }
    }
  }

  function handleUseExistingRepo() {
    if (ghStep.kind !== "repo_choice") return;
    const { token } = ghStep;
    setGhStep({ kind: "repo_input", token });
  }

  async function handleConnectRepo() {
    if (ghStep.kind !== "repo_input") return;
    const { token } = ghStep;
    const nwo = repoInput.trim();
    if (!nwo.includes("/")) {
      setError("Enter the repo as owner/repo-name");
      return;
    }
    setError(null);
    setGhStep({ kind: "syncing" });
    try {
      const meta = await getRepoMeta(token, nwo);
      const pulled = await pullRepo(token, nwo);
      await setRepo(pulled);
      await saveSyncMeta({
        lastPullSha: meta.latestSha,
        lastSyncedAt: new Date().toISOString(),
        connectedRepo: nwo,
        connectedUser: meta.login,
      });
      navigate("/plan/household", { replace: true });
    } catch (err) {
      setGhStep({ kind: "repo_input", token });
      setError(err instanceof Error ? err.message : "Failed to connect to repository");
    }
  }

  const ghDialogOpen =
    ghStep.kind === "waiting" ||
    ghStep.kind === "polling" ||
    ghStep.kind === "repo_choice" ||
    ghStep.kind === "creating_repo" ||
    ghStep.kind === "repo_input" ||
    ghStep.kind === "syncing";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldCheck className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Family Prepared</h1>
          <p className="text-muted-foreground">
            Build your emergency plan — offline-first, private, always available.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 px-4 py-3">
          Everything is stored on this device — no account needed. You can enable
          cloud backup at any time from Settings.
        </p>

        <div className="space-y-4">
          <Card className="border-green-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Start fresh</CardTitle>
              <CardDescription>
                Create a new plan — everything stays on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="plan-name">Plan name</Label>
                <Input
                  id="plan-name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Smith Family Plan"
                />
              </div>
              <Button
                className="w-full bg-green-700 hover:bg-green-800 text-white"
                onClick={handleStartFresh}
                disabled={!initialized}
              >
                {initialized ? "Create plan" : "Loading…"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Restore from a saved file</CardTitle>
              <CardDescription>
                Load a plan from a .zip file you exported or received.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleImportZip}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importing ? "Importing…" : "Choose .zip file"}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleConnectGitHub}
            >
              <Cloud className="h-4 w-4" />
              Sign in to restore from cloud backup
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Device Flow Dialog */}
      <Dialog open={ghDialogOpen} onOpenChange={(open) => { if (!open) handleCancelGitHub(); }}>
        <DialogContent className="bg-white">
          {(ghStep.kind === "waiting" || ghStep.kind === "polling") && (
            <>
              <DialogHeader>
                <DialogTitle>Set up cloud backup</DialogTitle>
                <DialogDescription>
                  Visit the link below and enter your one-time code to connect.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-lg border bg-muted/40 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your one-time code</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">
                    {ghStep.kind === "waiting" ? ghStep.userCode : ""}
                  </p>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      ghStep.kind === "waiting" ? ghStep.verificationUri : "https://github.com/login/device",
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
                <Button variant="ghost" className="w-full" onClick={handleCancelGitHub}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {ghStep.kind === "repo_choice" && (
            <>
              <DialogHeader>
                <DialogTitle>Set up your cloud backup</DialogTitle>
                <DialogDescription>
                  We'll create a private backup repository for your plan — just confirm the name.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="repo-name-input">Backup name</Label>
                  <Input
                    id="repo-name-input"
                    value={repoNameInput}
                    onChange={(e) => setRepoNameInput(e.target.value)}
                    placeholder="family-prepared-data"
                  />
                  <p className="text-xs text-muted-foreground">
                    A private repository will be created on your GitHub account.
                  </p>
                </div>
                <Button
                  className="w-full bg-green-700 hover:bg-green-800 text-white"
                  onClick={handleCreateRepo}
                  disabled={!repoNameInput.trim()}
                >
                  Create backup &amp; save plan
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                  onClick={handleUseExistingRepo}
                >
                  I already have a backup repository
                </button>
                <Button variant="ghost" className="w-full" onClick={handleCancelGitHub}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {ghStep.kind === "creating_repo" && (
            <>
              <DialogHeader>
                <DialogTitle>Creating your backup…</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Setting up your private repository…</span>
              </div>
            </>
          )}

          {ghStep.kind === "repo_input" && (
            <>
              <DialogHeader>
                <DialogTitle>Connect existing backup</DialogTitle>
                <DialogDescription>
                  Enter the repository name that holds your plan (e.g. <code>yourname/family-plan</code>).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="repo-input">Cloud backup name</Label>
                  <Input
                    id="repo-input"
                    placeholder="owner/repo-name"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleConnectRepo} disabled={!repoInput.trim()}>
                  Load plan from cloud backup
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleCancelGitHub}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {ghStep.kind === "syncing" && (
            <>
              <DialogHeader>
                <DialogTitle>Loading your plan…</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Fetching plan from cloud backup…</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
