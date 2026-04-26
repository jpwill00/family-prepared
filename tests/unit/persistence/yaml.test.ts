import { describe, it, expect } from "vitest";
import { parseRepo, serializeRepo } from "@/lib/persistence/yaml";
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

// ── parseRepo ────────────────────────────────────────────────────────────────

describe("parseRepo", () => {
  it("returns empty repo from empty file map", () => {
    const result = parseRepo(new Map());
    expect(result.plan).toBeDefined();
    expect(result.plan.household.members).toEqual([]);
  });

  it("parses plan.yaml", () => {
    const files = new Map([
      ["plan.yaml", "name: Smith Family Plan\nversion: 1.0.0\n"],
    ]);
    const result = parseRepo(files);
    expect(result.plan_yaml.name).toBe("Smith Family Plan");
  });

  it("parses plan/household/members.yaml", () => {
    const files = new Map([
      [
        "plan/household/members.yaml",
        "members:\n  - id: m1\n    name: Alice\n    birth_date: '1985-06-01'\n",
      ],
    ]);
    const result = parseRepo(files);
    expect(result.plan.household.members).toHaveLength(1);
    expect(result.plan.household.members[0].name).toBe("Alice");
    expect(result.plan.household.members[0].birth_date).toBe("1985-06-01");
  });

  it("parses plan/communication/pace.yaml", () => {
    const files = new Map([
      [
        "plan/communication/pace.yaml",
        [
          "tiers:",
          "  - tier: primary",
          "    protocol_notes: Call first",
          "    contacts:",
          "      - id: c1",
          "        name: Bob",
          "        role: spouse",
          "        channel: cell",
          "        value: '555-0001'",
        ].join("\n"),
      ],
    ]);
    const result = parseRepo(files);
    expect(result.plan.communication.tiers).toHaveLength(1);
    expect(result.plan.communication.tiers[0].tier).toBe("primary");
    expect(result.plan.communication.tiers[0].contacts[0].name).toBe("Bob");
  });

  it("parses plan/inventory/go-bag.yaml", () => {
    const files = new Map([
      [
        "plan/inventory/go-bag.yaml",
        "go_bag:\n  - id: ci1\n    label: Water (1 gal)\n    checked: false\n",
      ],
    ]);
    const result = parseRepo(files);
    expect(result.plan.inventory.go_bag).toHaveLength(1);
    expect(result.plan.inventory.go_bag[0].label).toBe("Water (1 gal)");
  });

  it("parses library/library.yaml", () => {
    const files = new Map([
      [
        "library/library.yaml",
        "version: 1.0.0\ncontent_areas:\n  - path: medical\n    content_type: article_collection\n    title: Medical Reference\n",
      ],
    ]);
    const result = parseRepo(files);
    expect(result.library_manifest?.content_areas).toHaveLength(1);
    expect(result.library_manifest?.content_areas[0].title).toBe("Medical Reference");
  });

  it("preserves unknown YAML fields (pass-through)", () => {
    const files = new Map([
      ["plan.yaml", "name: Test\nversion: 1.0.0\nunknown_future_field: keep_me\n"],
    ]);
    const result = parseRepo(files);
    // @ts-expect-error — intentional unknown field test
    expect((result.plan_yaml as Record<string, unknown>).unknown_future_field).toBe("keep_me");
  });
});

// ── serializeRepo ────────────────────────────────────────────────────────────

describe("serializeRepo", () => {
  it("produces plan.yaml from repo", () => {
    const files = serializeRepo(EMPTY_REPO);
    expect(files.has("plan.yaml")).toBe(true);
    expect(files.get("plan.yaml")).toContain("Test Family Plan");
  });

  it("produces plan/household/members.yaml", () => {
    const repo: Repo = {
      ...EMPTY_REPO,
      plan: {
        ...EMPTY_REPO.plan,
        household: { members: [{ id: "m1", name: "Alice" }] },
      },
    };
    const files = serializeRepo(repo);
    expect(files.has("plan/household/members.yaml")).toBe(true);
    expect(files.get("plan/household/members.yaml")).toContain("Alice");
  });

  it("produces plan/communication/pace.yaml", () => {
    const repo: Repo = {
      ...EMPTY_REPO,
      plan: {
        ...EMPTY_REPO.plan,
        communication: {
          tiers: [
            {
              tier: "primary",
              contacts: [],
              protocol_notes: "Call first",
            },
          ],
        },
      },
    };
    const files = serializeRepo(repo);
    expect(files.has("plan/communication/pace.yaml")).toBe(true);
    expect(files.get("plan/communication/pace.yaml")).toContain("primary");
  });
});

// ── Round-trip ───────────────────────────────────────────────────────────────

describe("round-trip", () => {
  it("round-trips an empty repo", () => {
    const files = serializeRepo(EMPTY_REPO);
    const parsed = parseRepo(files);
    expect(parsed.plan.household.members).toEqual([]);
    expect(parsed.plan.communication.tiers).toEqual([]);
  });

  it("round-trips household members", () => {
    const repo: Repo = {
      ...EMPTY_REPO,
      plan: {
        ...EMPTY_REPO.plan,
        household: {
          members: [
            {
              id: "m1",
              name: "Alice",
              birth_date: "1985-06-01",
              dietary: "vegetarian",
              medical: "EpiPen",
            },
            { id: "m2", name: "Bob" },
          ],
        },
      },
    };
    const parsed = parseRepo(serializeRepo(repo));
    expect(parsed.plan.household.members).toHaveLength(2);
    expect(parsed.plan.household.members[0].name).toBe("Alice");
    expect(parsed.plan.household.members[0].dietary).toBe("vegetarian");
    expect(parsed.plan.household.members[1].name).toBe("Bob");
  });

  it("round-trips PACE tiers with contacts", () => {
    const repo: Repo = {
      ...EMPTY_REPO,
      plan: {
        ...EMPTY_REPO.plan,
        communication: {
          tiers: [
            {
              tier: "primary",
              contacts: [
                { id: "c1", name: "Alice", role: "spouse", channel: "cell", value: "555-0001" },
              ],
              protocol_notes: "Call first",
            },
          ],
        },
      },
    };
    const parsed = parseRepo(serializeRepo(repo));
    expect(parsed.plan.communication.tiers[0].contacts[0].value).toBe("555-0001");
  });

  it("round-trips inventory", () => {
    const repo: Repo = {
      ...EMPTY_REPO,
      plan: {
        ...EMPTY_REPO.plan,
        inventory: {
          go_bag: [{ id: "ci1", label: "Water (1 gal)", checked: true }],
          medications: [{ id: "med1", name: "Metformin", dose: "500mg", expiration: "2027-03" }],
          home_supplies: { water_gallons: 14, food_days: 7 },
        },
      },
    };
    const parsed = parseRepo(serializeRepo(repo));
    expect(parsed.plan.inventory.go_bag[0].checked).toBe(true);
    expect(parsed.plan.inventory.medications[0].dose).toBe("500mg");
    expect(parsed.plan.inventory.home_supplies.water_gallons).toBe(14);
  });

  it("round-trips logistics", () => {
    const repo: Repo = {
      ...EMPTY_REPO,
      plan: {
        ...EMPTY_REPO.plan,
        logistics: {
          safe_rooms: [{ id: "sr1", location: "Basement NE corner", notes: "Has kit" }],
          meeting_points: [{ id: "mp1", type: "primary", description: "Oak tree" }],
          evacuation_routes: [{ id: "er1", name: "Route A", geojson: '{"type":"LineString"}' }],
        },
      },
    };
    const parsed = parseRepo(serializeRepo(repo));
    expect(parsed.plan.logistics.safe_rooms[0].location).toBe("Basement NE corner");
    expect(parsed.plan.logistics.meeting_points[0].type).toBe("primary");
    expect(parsed.plan.logistics.evacuation_routes[0].geojson).toBe('{"type":"LineString"}');
  });
});

// ── Zone enforcement ─────────────────────────────────────────────────────────

describe("zone enforcement", () => {
  it("throws ZoneWriteError when writing to library/ path", async () => {
    const { ZoneWriteError, assertWritable } = await import("@/lib/persistence/yaml");
    expect(() => assertWritable("library/medical/article.md")).toThrowError(ZoneWriteError);
  });

  it("throws ZoneWriteError when writing to packs/ path", async () => {
    const { ZoneWriteError, assertWritable } = await import("@/lib/persistence/yaml");
    expect(() => assertWritable("packs/some-pack/content.md")).toThrowError(ZoneWriteError);
  });

  it("allows writes to plan/", async () => {
    const { assertWritable } = await import("@/lib/persistence/yaml");
    expect(() => assertWritable("plan/household/members.yaml")).not.toThrow();
  });

  it("allows writes to custom/", async () => {
    const { assertWritable } = await import("@/lib/persistence/yaml");
    expect(() => assertWritable("custom/pets-emergency/_meta.yaml")).not.toThrow();
  });
});
