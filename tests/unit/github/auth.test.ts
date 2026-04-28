import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock idb persistence so tests don't need a real IndexedDB
vi.mock("@/lib/persistence/idb", () => ({
  saveToken: vi.fn(),
  loadToken: vi.fn().mockResolvedValue(null),
  clearToken: vi.fn(),
  clearSyncMeta: vi.fn(),
}));

import { startDeviceFlow, pollOnce, pollForToken, getStoredToken, revokeToken } from "@/lib/github/auth";
import * as idb from "@/lib/persistence/idb";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

const DEVICE_STATE = {
  device_code: "dev-code-abc",
  user_code: "ABCD-1234",
  verification_uri: "https://github.com/login/device",
  expires_in: 900,
  interval: 5,
};

describe("startDeviceFlow", () => {
  it("POSTs to device code endpoint and returns state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => DEVICE_STATE,
    });

    const result = await startDeviceFlow();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://github.com/login/device/code",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.user_code).toBe("ABCD-1234");
    expect(result.verification_uri).toBe("https://github.com/login/device");
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(startDeviceFlow()).rejects.toThrow("500");
  });
});

describe("pollOnce", () => {
  it("returns authorized + stores token when access_token present", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "gho_test_token" }),
    });

    const result = await pollOnce(DEVICE_STATE);

    expect(result.status).toBe("authorized");
    if (result.status === "authorized") {
      expect(result.token).toBe("gho_test_token");
    }
    expect(idb.saveToken).toHaveBeenCalledWith("gho_test_token");
  });

  it("returns pending on authorization_pending error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "authorization_pending" }),
    });

    const result = await pollOnce(DEVICE_STATE);
    expect(result.status).toBe("pending");
  });

  it("returns slow_down with updated interval", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "slow_down", interval: "10" }),
    });

    const result = await pollOnce(DEVICE_STATE);
    expect(result.status).toBe("slow_down");
    if (result.status === "slow_down") {
      expect(result.interval).toBe(10);
    }
  });

  it("returns expired on expired_token error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "expired_token" }),
    });

    const result = await pollOnce(DEVICE_STATE);
    expect(result.status).toBe("expired");
  });
});

describe("pollForToken", () => {
  it("returns null immediately when signal is already aborted", async () => {
    const ac = new AbortController();
    ac.abort();
    const result = await pollForToken(DEVICE_STATE, ac.signal);
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when device code expires (expires_in = 0)", async () => {
    const expiredState = { ...DEVICE_STATE, expires_in: 0, interval: 0 };
    const result = await pollForToken(expiredState);
    expect(result).toBeNull();
  });
});

describe("getStoredToken", () => {
  it("returns null when no token is stored", async () => {
    vi.mocked(idb.loadToken).mockResolvedValueOnce(null);
    expect(await getStoredToken()).toBeNull();
  });

  it("returns stored token", async () => {
    vi.mocked(idb.loadToken).mockResolvedValueOnce("gho_stored_token");
    expect(await getStoredToken()).toBe("gho_stored_token");
  });
});

describe("revokeToken", () => {
  it("clears IDB token and sync meta even when revocation fetch fails", async () => {
    vi.mocked(idb.loadToken).mockResolvedValueOnce("gho_test");
    mockFetch.mockRejectedValueOnce(new Error("network error"));

    await revokeToken();

    expect(idb.clearToken).toHaveBeenCalled();
    expect(idb.clearSyncMeta).toHaveBeenCalled();
  });

  it("skips revocation fetch when no token is stored", async () => {
    vi.mocked(idb.loadToken).mockResolvedValueOnce(null);
    await revokeToken();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(idb.clearToken).toHaveBeenCalled();
  });
});
