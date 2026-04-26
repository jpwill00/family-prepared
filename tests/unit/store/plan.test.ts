import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStore = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  get: vi.fn((key: string) => Promise.resolve(mockStore.get(key) ?? undefined)),
  set: vi.fn((key: string, value: unknown) => {
    mockStore.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    mockStore.delete(key);
    return Promise.resolve();
  }),
}));

import { act } from "@testing-library/react";
import { usePlanStore } from "@/lib/store/plan";

beforeEach(() => {
  mockStore.clear();
  vi.clearAllMocks();
  usePlanStore.setState({
    repo: null,
    initialized: false,
  });
});

// ── initialize ───────────────────────────────────────────────────────────────

describe("initialize", () => {
  it("sets initialized to true", async () => {
    await act(async () => {
      await usePlanStore.getState().initialize();
    });
    expect(usePlanStore.getState().initialized).toBe(true);
  });

  it("loads empty repo from IDB when nothing stored", async () => {
    await act(async () => {
      await usePlanStore.getState().initialize();
    });
    const { repo } = usePlanStore.getState();
    expect(repo).not.toBeNull();
    expect(repo?.plan.household.members).toEqual([]);
  });

  it("loads saved repo from IDB when data exists", async () => {
    // Pre-populate IDB via saveRepo
    const { saveRepo } = await import("@/lib/persistence/idb");
    await saveRepo({
      plan_yaml: { name: "Loaded Plan", version: "1.0.0", content_areas: [], installed_packs: [] },
      plan: {
        household: { members: [{ id: "m1", name: "Alice" }] },
        communication: { tiers: [] },
        logistics: { safe_rooms: [], meeting_points: [], evacuation_routes: [] },
        inventory: { go_bag: [], medications: [], home_supplies: { water_gallons: 0, food_days: 0 } },
      },
      installed_packs: { installed: [] },
    });

    await act(async () => {
      await usePlanStore.getState().initialize();
    });

    const { repo } = usePlanStore.getState();
    expect(repo?.plan_yaml.name).toBe("Loaded Plan");
    expect(repo?.plan.household.members).toHaveLength(1);
    expect(repo?.plan.household.members[0].name).toBe("Alice");
  });

  it("is idempotent (safe to call twice)", async () => {
    await act(async () => {
      await usePlanStore.getState().initialize();
      await usePlanStore.getState().initialize();
    });
    expect(usePlanStore.getState().initialized).toBe(true);
  });
});

// ── setRepo ──────────────────────────────────────────────────────────────────

describe("setRepo", () => {
  it("replaces the repo in state", async () => {
    await act(async () => { await usePlanStore.getState().initialize(); });

    const newRepo = {
      plan_yaml: { name: "New Plan", version: "1.0.0", content_areas: [], installed_packs: [] },
      plan: {
        household: { members: [{ id: "m1", name: "Bob" }] },
        communication: { tiers: [] },
        logistics: { safe_rooms: [], meeting_points: [], evacuation_routes: [] },
        inventory: { go_bag: [], medications: [], home_supplies: { water_gallons: 5, food_days: 3 } },
      },
      installed_packs: { installed: [] },
    };

    await act(async () => { await usePlanStore.getState().setRepo(newRepo); });
    expect(usePlanStore.getState().repo?.plan_yaml.name).toBe("New Plan");
    expect(usePlanStore.getState().repo?.plan.household.members[0].name).toBe("Bob");
  });

  it("persists to IDB", async () => {
    await act(async () => { await usePlanStore.getState().initialize(); });

    const { set } = await import("idb-keyval");
    await act(async () => {
      await usePlanStore.getState().setRepo({
        plan_yaml: { name: "Saved Plan", version: "1.0.0", content_areas: [], installed_packs: [] },
        plan: {
          household: { members: [] },
          communication: { tiers: [] },
          logistics: { safe_rooms: [], meeting_points: [], evacuation_routes: [] },
          inventory: { go_bag: [], medications: [], home_supplies: { water_gallons: 0, food_days: 0 } },
        },
        installed_packs: { installed: [] },
      });
    });
    expect(set).toHaveBeenCalled();
  });
});

// ── updateHousehold ──────────────────────────────────────────────────────────

describe("updateHousehold", () => {
  it("patches household members", async () => {
    await act(async () => { await usePlanStore.getState().initialize(); });

    await act(async () => {
      await usePlanStore.getState().updateHousehold({
        members: [{ id: "m1", name: "Carol" }],
      });
    });

    expect(usePlanStore.getState().repo?.plan.household.members[0].name).toBe("Carol");
  });

  it("preserves other plan sections when updating household", async () => {
    await act(async () => { await usePlanStore.getState().initialize(); });

    await act(async () => {
      await usePlanStore.getState().updateInventory({
        go_bag: [{ id: "ci1", label: "Water", checked: false }],
        medications: [],
        home_supplies: { water_gallons: 7, food_days: 3 },
      });
    });

    await act(async () => {
      await usePlanStore.getState().updateHousehold({ members: [{ id: "m1", name: "Dan" }] });
    });

    expect(usePlanStore.getState().repo?.plan.inventory.home_supplies.water_gallons).toBe(7);
    expect(usePlanStore.getState().repo?.plan.household.members[0].name).toBe("Dan");
  });
});

// ── reset ────────────────────────────────────────────────────────────────────

describe("reset", () => {
  it("clears IDB and resets to empty repo", async () => {
    await act(async () => { await usePlanStore.getState().initialize(); });

    await act(async () => {
      await usePlanStore.getState().updateHousehold({ members: [{ id: "m1", name: "Eve" }] });
    });

    await act(async () => { await usePlanStore.getState().reset(); });

    expect(usePlanStore.getState().repo?.plan.household.members).toEqual([]);
    expect(mockStore.has("repo")).toBe(false);
  });
});
