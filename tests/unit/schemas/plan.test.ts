import { describe, it, expect } from "vitest";
import {
  HouseholdMemberSchema,
  PaceTierSchema,
  ContactSchema,
  SafeRoomSchema,
  MeetingPointSchema,
  EvacuationRouteSchema,
  ChecklistItemSchema,
  MedicationSchema,
  ContentAreaMetaSchema,
  LibraryManifestSchema,
  PlanSchema,
  RepoSchema,
} from "@/lib/schemas/plan";

// ── HouseholdMember ─────────────────────────────────────────────────────────

describe("HouseholdMemberSchema", () => {
  it("accepts a minimal member", () => {
    const r = HouseholdMemberSchema.safeParse({ id: "m1", name: "Alice" });
    expect(r.success).toBe(true);
  });

  it("accepts a full member", () => {
    const r = HouseholdMemberSchema.safeParse({
      id: "m1",
      name: "Alice",
      birth_date: "1985-06-01",
      dietary: "vegetarian",
      medical: "EpiPen required",
      photo_path: "plan/household/photos/alice.jpg",
    });
    expect(r.success).toBe(true);
  });

  it("rejects member without name", () => {
    const r = HouseholdMemberSchema.safeParse({ id: "m1" });
    expect(r.success).toBe(false);
  });

  it("rejects member without id", () => {
    const r = HouseholdMemberSchema.safeParse({ name: "Alice" });
    expect(r.success).toBe(false);
  });
});

// ── Contact ─────────────────────────────────────────────────────────────────

describe("ContactSchema", () => {
  it("accepts a valid contact", () => {
    const r = ContactSchema.safeParse({
      id: "c1",
      name: "Bob",
      role: "neighbor",
      channel: "phone",
      value: "555-1234",
    });
    expect(r.success).toBe(true);
  });

  it("rejects contact without value", () => {
    const r = ContactSchema.safeParse({
      id: "c1",
      name: "Bob",
      role: "neighbor",
      channel: "phone",
    });
    expect(r.success).toBe(false);
  });
});

// ── PaceTier ────────────────────────────────────────────────────────────────

describe("PaceTierSchema", () => {
  it("accepts all four tier types", () => {
    for (const tier of ["primary", "alternate", "contingency", "emergency"]) {
      const r = PaceTierSchema.safeParse({
        tier,
        contacts: [],
        protocol_notes: "",
      });
      expect(r.success).toBe(true);
    }
  });

  it("rejects unknown tier type", () => {
    const r = PaceTierSchema.safeParse({
      tier: "backup",
      contacts: [],
      protocol_notes: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts tier with contacts", () => {
    const r = PaceTierSchema.safeParse({
      tier: "primary",
      contacts: [
        { id: "c1", name: "Alice", role: "spouse", channel: "cell", value: "555-0001" },
      ],
      protocol_notes: "Call first, then text",
      out_of_town_contact: { id: "c2", name: "Uncle Joe", role: "uncle", channel: "email", value: "joe@example.com" },
    });
    expect(r.success).toBe(true);
  });
});

// ── SafeRoom / MeetingPoint / EvacuationRoute ────────────────────────────────

describe("SafeRoomSchema", () => {
  it("accepts valid safe room", () => {
    const r = SafeRoomSchema.safeParse({
      id: "sr1",
      location: "Basement northeast corner",
      notes: "Has emergency kit",
    });
    expect(r.success).toBe(true);
  });
});

describe("MeetingPointSchema", () => {
  it("accepts primary and alternate types", () => {
    for (const type of ["primary", "alternate"]) {
      const r = MeetingPointSchema.safeParse({
        id: "mp1",
        type,
        description: "Front yard oak tree",
        address: "123 Main St",
      });
      expect(r.success).toBe(true);
    }
  });
});

describe("EvacuationRouteSchema", () => {
  it("accepts route with GeoJSON", () => {
    const r = EvacuationRouteSchema.safeParse({
      id: "er1",
      name: "Route A — North",
      geojson: '{"type":"LineString","coordinates":[]}',
    });
    expect(r.success).toBe(true);
  });

  it("accepts route without GeoJSON (not yet drawn)", () => {
    const r = EvacuationRouteSchema.safeParse({
      id: "er1",
      name: "Route A — North",
    });
    expect(r.success).toBe(true);
  });
});

// ── ChecklistItem / Medication ───────────────────────────────────────────────

describe("ChecklistItemSchema", () => {
  it("defaults checked to false", () => {
    const r = ChecklistItemSchema.safeParse({ id: "ci1", label: "Water (1 gal)" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.checked).toBe(false);
  });

  it("accepts checked item", () => {
    const r = ChecklistItemSchema.safeParse({ id: "ci1", label: "Water (1 gal)", checked: true });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.checked).toBe(true);
  });
});

describe("MedicationSchema", () => {
  it("accepts a full medication", () => {
    const r = MedicationSchema.safeParse({
      id: "med1",
      name: "Metformin",
      dose: "500mg",
      frequency: "twice daily",
      expiration: "2027-03",
      who: "m1",
    });
    expect(r.success).toBe(true);
  });

  it("accepts minimal medication (name only required)", () => {
    const r = MedicationSchema.safeParse({ id: "med1", name: "Aspirin" });
    expect(r.success).toBe(true);
  });
});

// ── ContentAreaMeta / LibraryManifest ────────────────────────────────────────

describe("ContentAreaMetaSchema", () => {
  it("accepts article_collection meta", () => {
    const r = ContentAreaMetaSchema.safeParse({
      content_type: "article_collection",
      title: "Medical Reference",
      icon: "heart-pulse",
    });
    expect(r.success).toBe(true);
  });

  it("falls back gracefully for unknown content_type", () => {
    const r = ContentAreaMetaSchema.safeParse({
      content_type: "future_type",
      title: "Something New",
    });
    expect(r.success).toBe(true);
  });
});

describe("LibraryManifestSchema", () => {
  it("accepts a minimal library manifest", () => {
    const r = LibraryManifestSchema.safeParse({
      version: "1.0.0",
      content_areas: [
        { path: "medical", content_type: "article_collection", title: "Medical" },
      ],
    });
    expect(r.success).toBe(true);
  });
});

// ── PlanSchema / RepoSchema ──────────────────────────────────────────────────

describe("PlanSchema", () => {
  it("accepts empty plan (all arrays default to [])", () => {
    const r = PlanSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts plan with household members", () => {
    const r = PlanSchema.safeParse({
      household: {
        members: [{ id: "m1", name: "Alice" }],
      },
    });
    expect(r.success).toBe(true);
  });
});

describe("RepoSchema", () => {
  it("accepts an empty repo", () => {
    const r = RepoSchema.safeParse({
      plan_yaml: { name: "Our Family Plan", version: "1.0.0" },
    });
    expect(r.success).toBe(true);
  });
});
