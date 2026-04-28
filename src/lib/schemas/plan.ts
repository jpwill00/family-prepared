import { z } from "zod";

// ── Household ────────────────────────────────────────────────────────────────

export const HouseholdMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  birth_date: z.string().optional(),
  dietary: z.string().optional(),
  medical: z.string().optional(), // secure: true
  photo_path: z.string().optional(),
});

export const HouseholdSchema = z.object({
  members: z.array(HouseholdMemberSchema).default([]),
});

// ── Communication ────────────────────────────────────────────────────────────

export const ContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  channel: z.string().min(1),
  value: z.string().min(1), // secure: true
  notes: z.string().optional(),
});

export const PaceTierSchema = z.object({
  tier: z.enum(["primary", "alternate", "contingency", "emergency"]),
  contacts: z.array(ContactSchema).default([]),
  protocol_notes: z.string().default(""),
  out_of_town_contact: ContactSchema.optional(),
});

export const CommunicationSchema = z.object({
  tiers: z.array(PaceTierSchema).default([]),
});

// ── Logistics ────────────────────────────────────────────────────────────────

export const SafeRoomSchema = z.object({
  id: z.string().min(1),
  location: z.string().min(1),
  notes: z.string().optional(),
});

export const MeetingPointSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["primary", "alternate"]),
  description: z.string().min(1),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const EvacuationRouteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  geojson: z.string().optional(),
  notes: z.string().optional(),
});

export const LogisticsSchema = z.object({
  safe_rooms: z.array(SafeRoomSchema).default([]),
  meeting_points: z.array(MeetingPointSchema).default([]),
  evacuation_routes: z.array(EvacuationRouteSchema).default([]),
});

// ── Inventory ────────────────────────────────────────────────────────────────

export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  checked: z.boolean().default(false),
  category: z.string().optional(),
});

// All Medication fields except id are secure: true
export const MedicationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1), // secure: true
  dose: z.string().optional(), // secure: true
  frequency: z.string().optional(), // secure: true
  expiration: z.string().optional(), // secure: true
  who: z.string().optional(), // secure: true
  notes: z.string().optional(), // secure: true
});

export const HomeSuppliesSchema = z.object({
  water_gallons: z.number().nonnegative().default(0),
  food_days: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export const InventorySchema = z.object({
  go_bag: z.array(ChecklistItemSchema).default([]),
  medications: z.array(MedicationSchema).default([]),
  home_supplies: HomeSuppliesSchema.default({}),
});

// ── Content metadata ─────────────────────────────────────────────────────────

export const ContentAreaMetaSchema = z.object({
  content_type: z.string().default("article_collection"),
  title: z.string().min(1),
  icon: z.string().optional(),
  sources: z.array(z.string()).optional(),
  last_reviewed: z.string().optional(),
});

export const LibraryContentAreaSchema = z.object({
  path: z.string().min(1),
  content_type: z.string().default("article_collection"),
  title: z.string().min(1),
});

export const LibraryManifestSchema = z.object({
  version: z.string().default("1.0.0"),
  sources_index: z.array(z.string()).optional(),
  content_areas: z.array(LibraryContentAreaSchema).default([]),
});

// ── Plan root ────────────────────────────────────────────────────────────────

export const PlanSchema = z.object({
  household: HouseholdSchema.default({}),
  communication: CommunicationSchema.default({}),
  logistics: LogisticsSchema.default({}),
  inventory: InventorySchema.default({}),
});

// ── Repo root ────────────────────────────────────────────────────────────────

export const PlanYamlSchema = z.object({
  name: z.string().default("My Family Plan"),
  version: z.string().default("1.0.0"),
  last_updated: z.string().optional(),
  content_areas: z.array(z.string()).default([]),
  installed_packs: z.array(z.string()).default([]),
});

export const InstalledPackEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string(),
  source: z.string().default("local-import"),
  checksum: z.string().optional(),
  installed_at: z.string().optional(),
});

export const InstalledPacksSchema = z.object({
  installed: z.array(InstalledPackEntrySchema).default([]),
});

export const RepoSchema = z.object({
  plan_yaml: PlanYamlSchema.default({}),
  plan: PlanSchema.default({}),
  library_manifest: LibraryManifestSchema.optional(),
  installed_packs: InstalledPacksSchema.default({}),
});

// ── TypeScript types ─────────────────────────────────────────────────────────

export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type PaceTier = z.infer<typeof PaceTierSchema>;
export type SafeRoom = z.infer<typeof SafeRoomSchema>;
export type MeetingPoint = z.infer<typeof MeetingPointSchema>;
export type EvacuationRoute = z.infer<typeof EvacuationRouteSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type Household = z.infer<typeof HouseholdSchema>;
export type Communication = z.infer<typeof CommunicationSchema>;
export type Logistics = z.infer<typeof LogisticsSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type ContentAreaMeta = z.infer<typeof ContentAreaMetaSchema>;
export type LibraryManifest = z.infer<typeof LibraryManifestSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type PlanYaml = z.infer<typeof PlanYamlSchema>;
export type InstalledPackEntry = z.infer<typeof InstalledPackEntrySchema>;
export type InstalledPacks = z.infer<typeof InstalledPacksSchema>;
export type Repo = z.infer<typeof RepoSchema>;
