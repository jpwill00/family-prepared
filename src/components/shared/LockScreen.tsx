import { useState, useEffect, type ReactNode } from "react";
import { usePlanStore } from "@/lib/store/plan";
import { hasEncryptedData, loadEncryptedFields } from "@/lib/persistence/idb";
import { deriveKey, decrypt, getOrCreateSalt } from "@/lib/crypto/secure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

type LockState = "checking" | "unlocked" | "locked";

export function LockScreen({ children }: Props) {
  const setCryptoKey = usePlanStore((s) => s.setCryptoKey);

  const [lockState, setLockState] = useState<LockState>("checking");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    hasEncryptedData().then((has) => {
      setLockState(has ? "locked" : "unlocked");
    });
  }, []);

  async function handleUnlock() {
    if (!passphrase) return;
    setError(null);
    setUnlocking(true);
    try {
      const salt = await getOrCreateSalt();
      const key = await deriveKey(passphrase, salt);

      // Verify key is correct by decrypting the first stored field.
      // crypto.subtle.decrypt throws DOMException on wrong passphrase.
      const fields = await loadEncryptedFields();
      if (fields) {
        const firstEntry = Object.values(fields)[0];
        if (firstEntry) {
          await decrypt(key, firstEntry.iv, firstEntry.ciphertext);
        }
      }

      setCryptoKey(key);
      setPassphrase("");
      setLockState("unlocked");
    } catch {
      setError("Incorrect passphrase. Please try again.");
    } finally {
      setUnlocking(false);
    }
  }

  if (lockState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (lockState === "locked") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <ShieldCheck className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Family Prepared</h1>
            <p className="text-sm text-muted-foreground">
              Your plan contains protected data. Enter your passphrase to continue.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="passphrase">Passphrase</Label>
              <Input
                id="passphrase"
                type="password"
                placeholder="Enter your passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                autoFocus
              />
            </div>
            <Button
              className="w-full bg-green-700 hover:bg-green-800 text-white"
              onClick={handleUnlock}
              disabled={!passphrase || unlocking}
            >
              {unlocking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlocking…
                </>
              ) : (
                "Unlock"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
