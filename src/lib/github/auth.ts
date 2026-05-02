// GitHub OAuth Device Flow — all GitHub auth goes through this module.

import { saveToken, loadToken, clearToken, clearSyncMeta } from "@/lib/persistence/idb";

const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string;

// VITE_GITHUB_PROXY_URL points to the Cloudflare Worker that proxies GitHub's
// OAuth endpoints and adds CORS headers. GitHub's own endpoints don't return
// Access-Control-Allow-Origin, so direct browser fetch() calls are blocked.
// See cloudflare/github-auth-proxy/ for the worker source and deploy instructions.
const PROXY_URL = (import.meta.env.VITE_GITHUB_PROXY_URL as string | undefined)?.replace(/\/$/, "");

const DEVICE_CODE_URL = PROXY_URL
  ? `${PROXY_URL}/device/code`
  : "https://github.com/login/device/code";

const ACCESS_TOKEN_URL = PROXY_URL
  ? `${PROXY_URL}/access_token`
  : "https://github.com/login/oauth/access_token";

export interface DeviceFlowState {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function startDeviceFlow(): Promise<DeviceFlowState> {
  const res = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: "repo" }),
  });
  if (!res.ok) throw new Error(`Device code request failed: ${res.status}`);
  return res.json() as Promise<DeviceFlowState>;
}

export type PollResult =
  | { status: "authorized"; token: string }
  | { status: "pending" }
  | { status: "slow_down"; interval: number }
  | { status: "expired" }
  | { status: "error"; message: string };

// Polls once; caller drives the loop so UI can cancel.
export async function pollOnce(state: DeviceFlowState): Promise<PollResult> {
  const res = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: state.device_code,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });
  if (!res.ok) return { status: "error", message: `HTTP ${res.status}` };

  const data = (await res.json()) as Record<string, string>;

  if (data.access_token) {
    await saveToken(data.access_token);
    return { status: "authorized", token: data.access_token };
  }
  if (data.error === "authorization_pending") return { status: "pending" };
  if (data.error === "slow_down") {
    const interval = Number(data.interval ?? state.interval + 5);
    return { status: "slow_down", interval };
  }
  if (data.error === "expired_token") return { status: "expired" };
  return { status: "error", message: data.error ?? "unknown" };
}

// Convenience wrapper: polls until authorized, expired, or aborted.
export async function pollForToken(
  state: DeviceFlowState,
  signal?: AbortSignal,
): Promise<string | null> {
  let interval = state.interval;
  const deadline = Date.now() + state.expires_in * 1000;

  while (Date.now() < deadline) {
    if (signal?.aborted) return null;

    await sleep(interval * 1000);
    if (signal?.aborted) return null;

    const result = await pollOnce(state);
    if (result.status === "authorized") return result.token;
    if (result.status === "expired") return null;
    if (result.status === "slow_down") interval = result.interval;
    // "pending" → keep looping
  }
  return null;
}

export async function getStoredToken(): Promise<string | null> {
  return loadToken();
}

export async function revokeToken(): Promise<void> {
  const token = await loadToken();
  if (token) {
    // Best-effort revocation — ignore errors (token may already be expired)
    try {
      await fetch(`https://api.github.com/applications/${CLIENT_ID}/token`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${btoa(`${CLIENT_ID}:`)}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: token }),
      });
    } catch {
      // ignore
    }
  }
  await clearToken();
  await clearSyncMeta();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
