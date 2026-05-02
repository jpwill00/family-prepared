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

  it("renders 'Restore from a saved file' as a secondary card", () => {
    renderOnboarding();
    expect(screen.getByText(/restore from a saved file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose \.zip file/i })).toBeInTheDocument();
  });

  it("renders the cloud backup option as a plain text link, not a Card", () => {
    renderOnboarding();
    const cloudLink = screen.getByRole("button", { name: /sign in to restore from cloud backup/i });
    expect(cloudLink).toBeInTheDocument();
    // Must NOT be a full-weight variant button — no bg-* class
    expect(cloudLink.className).not.toMatch(/bg-green-/);
    expect(cloudLink.className).not.toMatch(/variant-default/);
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
