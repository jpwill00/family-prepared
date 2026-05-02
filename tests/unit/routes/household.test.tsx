import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/persistence/idb", () => ({
  getCryptoPromptDismissed: vi.fn(() => Promise.resolve(false)),
  setCryptoPromptDismissed: vi.fn(() => Promise.resolve()),
}));

vi.mock("idb-keyval", () => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

// Store mock: no passphrase set, one member so we can see the list
const mockState = {
  repo: { plan: { household: { members: [{ id: "m1", name: "Alice" }] } } },
  cryptoKey: null,
  updateHousehold: vi.fn(() => Promise.resolve()),
};

vi.mock("@/lib/store/plan", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usePlanStore: (selector: (s: any) => unknown) => selector(mockState),
}));

import HouseholdRoute from "@/routes/plan/household";
import { getCryptoPromptDismissed, setCryptoPromptDismissed } from "@/lib/persistence/idb";

const mockGetDismissed = vi.mocked(getCryptoPromptDismissed);
const mockSetDismissed = vi.mocked(setCryptoPromptDismissed);

function renderHousehold() {
  return render(<HouseholdRoute />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: not yet dismissed, no passphrase
  mockGetDismissed.mockResolvedValue(false);
});

describe("HouseholdRoute — passphrase nudge banner", () => {
  it("does not show the nudge banner on initial render", () => {
    renderHousehold();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the nudge banner when the medical field is focused and not dismissed", async () => {
    renderHousehold();

    // Wait for the useEffect to resolve and set nudgeEligible
    await waitFor(() => expect(mockGetDismissed).toHaveBeenCalled());

    // Open the add-member dialog
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    // Focus the medical field
    const medicalInput = await screen.findByPlaceholderText(/epipen/i);
    fireEvent.focus(medicalInput);

    await waitFor(() => {
      // The dialog makes background aria-hidden; query with hidden:true to find the banner
      expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
      expect(screen.getByText(/this field is private/i, { selector: "*" })).toBeInTheDocument();
    });
  });

  it("dismisses the nudge and calls setCryptoPromptDismissed when X is clicked", async () => {
    renderHousehold();

    await waitFor(() => expect(mockGetDismissed).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /add member/i }));
    const medicalInput = await screen.findByPlaceholderText(/epipen/i);
    fireEvent.focus(medicalInput);

    await waitFor(() =>
      expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument(),
    );

    // The dismiss button is also in the aria-hidden background
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i, hidden: true }));

    await waitFor(() => {
      expect(screen.queryByRole("status", { hidden: true })).not.toBeInTheDocument();
      expect(mockSetDismissed).toHaveBeenCalledTimes(1);
    });
  });

  it("does not show the nudge when already dismissed", async () => {
    mockGetDismissed.mockResolvedValue(true);
    renderHousehold();

    fireEvent.click(screen.getByRole("button", { name: /add member/i }));
    const medicalInput = await screen.findByPlaceholderText(/epipen/i);
    fireEvent.focus(medicalInput);

    // Give async a moment to resolve
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
