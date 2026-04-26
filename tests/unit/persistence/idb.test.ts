import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock idb-keyval before importing the module under test
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

import { saveRepo, loadRepo, clearRepo } from "@/lib/persistence/idb";
import type { Repo } from "@/lib/schemas/plan";

const EMPTY_REPO: Repo = {
  plan_yaml: {
    name: "Test Family Plan",
    version: "1.0.0",
    content_areas: [],
    installed_packs: [],
  },
  plan: {
    household: { members: [] },
    communication: { tiers: [] },
    logistics: {
      safe_rooms: [],
      meeting_points: [],
      evacuation_routes: [],
    },
    inventory: {
      go_bag: [],
      medications: [],
      home_supplies: { water_gallons: 0, food_days: 0 },
    },
  },
  installed_packs: { installed: [] },
};

const POPULATED_REPO: Repo = {
  ...EMPTY_REPO,
  plan_yaml: { name: "Smith Family Plan", version: "1.0.0", content_areas: [], installed_packs: [] },
  plan: {
    ...EMPTY_REPO.plan,
    household: {
      members: [
        { id: "m1", name: "Alice", birth_date: "1985-06-01", dietary: "vegetarian" },
        { id: "m2", name: "Bob" },
      ],
    },
    inventory: {
      go_bag: [{ id: "ci1", label: "Water (1 gal)", checked: true }],
      medications: [{ id: "med1", name: "Metformin", dose: "500mg", expiration: "2027-03" }],
      home_supplies: { water_gallons: 14, food_days: 7 },
    },
  },
};

beforeEach(() => {
  mockStore.clear();
  vi.clearAllMocks();
});

// ── saveRepo ─────────────────────────────────────────────────────────────────

describe("saveRepo", () => {
  it("persists repo to IndexedDB under key 'repo'", async () => {
    await saveRepo(EMPTY_REPO);
    expect(mockStore.has("repo")).toBe(true);
  });

  it("stores serialized YAML files as a plain object", async () => {
    await saveRepo(EMPTY_REPO);
    const stored = mockStore.get("repo") as Record<string, string>;
    expect(typeof stored).toBe("object");
    expect(typeof stored["plan.yaml"]).toBe("string");
    expect(stored["plan.yaml"]).toContain("Test Family Plan");
  });

  it("stores all expected file keys", async () => {
    await saveRepo(POPULATED_REPO);
    const stored = mockStore.get("repo") as Record<string, string>;
    expect(stored).toHaveProperty("plan.yaml");
    expect(stored).toHaveProperty("plan/household/members.yaml");
    expect(stored).toHaveProperty("plan/communication/pace.yaml");
    expect(stored).toHaveProperty("plan/logistics/logistics.yaml");
    expect(stored).toHaveProperty("plan/inventory/go-bag.yaml");
    expect(stored).toHaveProperty("plan/inventory/medications.yaml");
    expect(stored).toHaveProperty("plan/inventory/home-supplies.yaml");
  });

  it("serializes member data correctly", async () => {
    await saveRepo(POPULATED_REPO);
    const stored = mockStore.get("repo") as Record<string, string>;
    expect(stored["plan/household/members.yaml"]).toContain("Alice");
    expect(stored["plan/household/members.yaml"]).toContain("vegetarian");
  });
});

// ── loadRepo ─────────────────────────────────────────────────────────────────

describe("loadRepo", () => {
  it("returns null when nothing is stored", async () => {
    const result = await loadRepo();
    expect(result).toBeNull();
  });

  it("returns a Repo when data is stored", async () => {
    await saveRepo(EMPTY_REPO);
    const result = await loadRepo();
    expect(result).not.toBeNull();
    expect(result?.plan).toBeDefined();
  });

  it("round-trips an empty repo", async () => {
    await saveRepo(EMPTY_REPO);
    const loaded = await loadRepo();
    expect(loaded?.plan.household.members).toEqual([]);
    expect(loaded?.plan.communication.tiers).toEqual([]);
    expect(loaded?.plan_yaml.name).toBe("Test Family Plan");
  });

  it("round-trips a populated repo", async () => {
    await saveRepo(POPULATED_REPO);
    const loaded = await loadRepo();
    expect(loaded?.plan_yaml.name).toBe("Smith Family Plan");
    expect(loaded?.plan.household.members).toHaveLength(2);
    expect(loaded?.plan.household.members[0].name).toBe("Alice");
    expect(loaded?.plan.household.members[0].dietary).toBe("vegetarian");
    expect(loaded?.plan.inventory.go_bag[0].checked).toBe(true);
    expect(loaded?.plan.inventory.home_supplies.water_gallons).toBe(14);
  });

  it("round-trips medications with all fields", async () => {
    await saveRepo(POPULATED_REPO);
    const loaded = await loadRepo();
    expect(loaded?.plan.inventory.medications[0].dose).toBe("500mg");
    expect(loaded?.plan.inventory.medications[0].expiration).toBe("2027-03");
  });
});

// ── clearRepo ─────────────────────────────────────────────────────────────────

describe("clearRepo", () => {
  it("removes stored repo", async () => {
    await saveRepo(EMPTY_REPO);
    expect(mockStore.has("repo")).toBe(true);
    await clearRepo();
    expect(mockStore.has("repo")).toBe(false);
  });

  it("loadRepo returns null after clear", async () => {
    await saveRepo(EMPTY_REPO);
    await clearRepo();
    const result = await loadRepo();
    expect(result).toBeNull();
  });

  it("is safe to call when nothing is stored", async () => {
    await expect(clearRepo()).resolves.not.toThrow();
  });
});
