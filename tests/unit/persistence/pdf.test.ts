import { describe, it, expect, vi } from "vitest";
import type { Repo } from "@/lib/schemas/plan";

// @react-pdf/renderer has no jsdom support — mock the module
vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (s: unknown) => s },
  pdf: () => ({
    toBlob: async () => new Blob(["PDF_CONTENT"], { type: "application/pdf" }),
  }),
}));

const MINIMAL_REPO: Repo = {
  plan_yaml: {
    name: "Test Family Plan",
    version: "1.0.0",
    content_areas: [],
    installed_packs: [],
  },
  plan: {
    household: {
      members: [
        {
          id: "m1",
          name: "Alice",
          birth_date: "1985-03-10",
          dietary: "Vegetarian",
          medical: "None",
        },
      ],
    },
    communication: {
      tiers: [
        {
          tier: "primary",
          protocol_notes: "Call first",
          contacts: [
            { id: "c1", name: "Bob", role: "Neighbor", channel: "phone", value: "555-1234" },
          ],
        },
      ],
    },
    logistics: {
      safe_rooms: [{ id: "sr1", location: "Basement", notes: "Has kit" }],
      meeting_points: [
        { id: "mp1", type: "primary", description: "Front yard", address: "123 Main St" },
      ],
      evacuation_routes: [{ id: "er1", name: "Route A", notes: "Avoid highway" }],
    },
    inventory: {
      go_bag: [{ id: "gb1", label: "Water bottle", checked: true }],
      medications: [
        { id: "med1", name: "Aspirin", dose: "100mg", who: "Alice", frequency: "daily", expiration: "2026-01" },
      ],
      home_supplies: { water_gallons: 10, food_days: 3, notes: "Pantry shelf" },
    },
  },
  installed_packs: { installed: [] },
};

describe("exportPdf", () => {
  it("returns a Blob", async () => {
    const { exportPdf } = await import("@/lib/persistence/pdf");
    const blob = await exportPdf(MINIMAL_REPO);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("blob is non-empty", async () => {
    const { exportPdf } = await import("@/lib/persistence/pdf");
    const blob = await exportPdf(MINIMAL_REPO);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("blob has pdf mime type", async () => {
    const { exportPdf } = await import("@/lib/persistence/pdf");
    const blob = await exportPdf(MINIMAL_REPO);
    expect(blob.type).toBe("application/pdf");
  });

  it("works with empty plan sections", async () => {
    const { exportPdf } = await import("@/lib/persistence/pdf");
    const emptyRepo: Repo = {
      plan_yaml: { name: "", version: "1.0.0", content_areas: [], installed_packs: [] },
      plan: {
        household: { members: [] },
        communication: { tiers: [] },
        logistics: { safe_rooms: [], meeting_points: [], evacuation_routes: [] },
        inventory: { go_bag: [], medications: [], home_supplies: { water_gallons: 0, food_days: 0 } },
      },
      installed_packs: { installed: [] },
    };
    const blob = await exportPdf(emptyRepo);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
