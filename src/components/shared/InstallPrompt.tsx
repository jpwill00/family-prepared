import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

const DISMISSED_KEY = "install-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "1");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-lg border bg-background p-4 shadow-lg max-w-xs">
      <Download className="h-5 w-5 shrink-0 text-green-700 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Install Family Prepared</p>
        <p className="text-xs text-muted-foreground mt-0.5">Access your plan offline, anytime.</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="bg-green-700 hover:bg-green-800 h-7 text-xs" onClick={handleInstall}>
            Install
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
