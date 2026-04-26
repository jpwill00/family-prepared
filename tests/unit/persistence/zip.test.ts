import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { exportRepoAsZip, importRepoFromZip } from "@/lib/persistence/zip";
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
    logistics: { safe_rooms: [], meeting_points: [], evacuation_routes: [] },
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
        { id: "m1", name: "Alice", dietary: "vegetarian" },
        { id: "m2", name: "Bob" },
      ],
    },
    inventory: {
      go_bag: [{ id: "ci1", label: "Water (1 gal)", checked: true }],
      medications: [{ id: "med1", name: "Metformin", dose: "500mg" }],
      home_supplies: { water_gallons: 14, food_days: 7 },
    },
  },
};

// ── exportRepoAsZip ──────────────────────────────────────────────────────────

describe("exportRepoAsZip", () => {
  it("returns a Blob", async () => {
    const blob = await exportRepoAsZip(EMPTY_REPO);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("produces a valid ZIP file", async () => {
    const blob = await exportRepoAsZip(EMPTY_REPO);
    const zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files).length).toBeGreaterThan(0);
  });

  it("ZIP contains plan.yaml", async () => {
    const blob = await exportRepoAsZip(EMPTY_REPO);
    const zip = await JSZip.loadAsync(blob);
    expect(zip.file("plan.yaml")).not.toBeNull();
  });

  it("ZIP contains all expected files", async () => {
    const blob = await exportRepoAsZip(POPULATED_REPO);
    const zip = await JSZip.loadAsync(blob);
    const files = Object.keys(zip.files);
    expect(files).toContain("plan.yaml");
    expect(files).toContain("plan/household/members.yaml");
    expect(files).toContain("plan/communication/pace.yaml");
    expect(files).toContain("plan/logistics/logistics.yaml");
    expect(files).toContain("plan/inventory/go-bag.yaml");
    expect(files).toContain("plan/inventory/medications.yaml");
    expect(files).toContain("plan/inventory/home-supplies.yaml");
  });

  it("plan.yaml content matches repo name", async () => {
    const blob = await exportRepoAsZip(POPULATED_REPO);
    const zip = await JSZip.loadAsync(blob);
    const content = await zip.file("plan.yaml")!.async("string");
    expect(content).toContain("Smith Family Plan");
  });

  it("household members.yaml contains member data", async () => {
    const blob = await exportRepoAsZip(POPULATED_REPO);
    const zip = await JSZip.loadAsync(blob);
    const content = await zip.file("plan/household/members.yaml")!.async("string");
    expect(content).toContain("Alice");
    expect(content).toContain("vegetarian");
  });
});

// ── importRepoFromZip ────────────────────────────────────────────────────────

describe("importRepoFromZip", () => {
  async function makeZipFile(repo: Repo): Promise<File> {
    const blob = await exportRepoAsZip(repo);
    return new File([blob], "plan.zip", { type: "application/zip" });
  }

  it("returns a Repo from a valid ZIP", async () => {
    const file = await makeZipFile(EMPTY_REPO);
    const result = await importRepoFromZip(file);
    expect(result.plan).toBeDefined();
  });

  it("round-trips an empty repo", async () => {
    const file = await makeZipFile(EMPTY_REPO);
    const result = await importRepoFromZip(file);
    expect(result.plan_yaml.name).toBe("Test Family Plan");
    expect(result.plan.household.members).toEqual([]);
  });

  it("round-trips a populated repo", async () => {
    const file = await makeZipFile(POPULATED_REPO);
    const result = await importRepoFromZip(file);
    expect(result.plan_yaml.name).toBe("Smith Family Plan");
    expect(result.plan.household.members).toHaveLength(2);
    expect(result.plan.household.members[0].name).toBe("Alice");
    expect(result.plan.household.members[0].dietary).toBe("vegetarian");
    expect(result.plan.inventory.go_bag[0].checked).toBe(true);
    expect(result.plan.inventory.home_supplies.water_gallons).toBe(14);
    expect(result.plan.inventory.medications[0].dose).toBe("500mg");
  });

  it("throws on an invalid ZIP file", async () => {
    const badFile = new File(["not a zip file"], "plan.zip", { type: "application/zip" });
    await expect(importRepoFromZip(badFile)).rejects.toThrow();
  });

  it("throws if plan.yaml is missing from ZIP", async () => {
    const zip = new JSZip();
    zip.file("plan/household/members.yaml", "members: []\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const file = new File([blob], "plan.zip", { type: "application/zip" });
    await expect(importRepoFromZip(file)).rejects.toThrow(/plan\.yaml/);
  });
});
