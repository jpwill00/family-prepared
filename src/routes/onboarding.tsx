import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/lib/store/plan";
import { importRepoFromZip } from "@/lib/persistence/zip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Upload, GitBranch, AlertCircle } from "lucide-react";

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const setRepo = usePlanStore((s) => s.setRepo);
  const repo = usePlanStore((s) => s.repo);

  const [planName, setPlanName] = useState("My Family Plan");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleStartFresh() {
    if (!repo) return;
    await setRepo({
      ...repo,
      plan_yaml: { ...repo.plan_yaml, name: planName.trim() || "My Family Plan" },
    });
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
      navigate("/plan/household", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import backup");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Start fresh</CardTitle>
              <CardDescription>
                Create a new plan with a blank template.
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
                className="w-full bg-green-700 hover:bg-green-800"
                onClick={handleStartFresh}
              >
                Create plan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Import a backup</CardTitle>
              <CardDescription>
                Restore from a .zip file you exported previously.
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
                {importing ? "Importing…" : "Choose .zip backup"}
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Connect to GitHub
                <span className="ml-auto text-xs font-normal text-muted-foreground">Coming in Sprint 2</span>
              </CardTitle>
              <CardDescription>
                Sync your plan to a private GitHub repository.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
