import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("idb-keyval", () => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/github/auth", () => ({
  startDeviceFlow: vi.fn(),
  pollForToken: vi.fn(),
}));

vi.mock("@/lib/library/seed", () => ({
  fetchSeedLibrary: vi.fn(() => Promise.resolve(new Map())),
}));

vi.mock("@/lib/persistence/idb", () => ({
  mergeFiles: vi.fn(() => Promise.resolve()),
  saveSyncMeta: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/persistence/zip", () => ({
  importRepoFromZip: vi.fn(),
}));

vi.mock("@/lib/github/sync", () => ({
  getRepoMeta: vi.fn(),
  pullRepo: vi.fn(),
}));

// ── Store mock (initialized = true so the button renders enabled) ────────────

const mockSetRepo = vi.fn(() => Promise.resolve());

vi.mock("@/lib/store/plan", () => ({
  usePlanStore: (selector: (s: { initialized: boolean; repo: null; setRepo: typeof mockSetRepo }) => unknown) =>
    selector({ initialized: true, repo: null, setRepo: mockSetRepo }),
}));

// ── Component under test ─────────────────────────────────────────────────────

import OnboardingRoute from "@/routes/onboarding";

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <OnboardingRoute />
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingRoute — local-first UX hierarchy", () => {
  it("renders the 'Create plan' button as the primary CTA", () => {
    renderOnboarding();
    const createBtn = screen.getByRole("button", { name: /create plan/i });
    expect(createBtn).toBeInTheDocument();
    // Primary styling: green background class
    expect(createBtn.className).toMatch(/bg-green-700/);
  });

  it("renders 'Open from ZIP file' as a secondary tile in the 'already have a plan' section", () => {
    renderOnboarding();
    expect(screen.getByText(/open from zip file/i)).toBeInTheDocument();
    expect(screen.getByText(/zip file you exported or received/i)).toBeInTheDocument();
  });

  it("renders the cloud backup option as an equal-weight tile alongside the ZIP option", () => {
    renderOnboarding();
    const cloudTile = screen.getByRole("button", { name: /restore from cloud/i });
    expect(cloudTile).toBeInTheDocument();
    // Must NOT have primary green styling — it is a secondary action tile
    expect(cloudTile.className).not.toMatch(/bg-green-/);
  });

  it("shows the 'no account needed' disclosure message", () => {
    renderOnboarding();
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
  });

  it("does not render a 'Connect to GitHub' card or heading", () => {
    renderOnboarding();
    expect(screen.queryByText(/connect to github/i)).not.toBeInTheDocument();
  });
});
