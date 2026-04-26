import yaml from "js-yaml";
import {
  PlanYamlSchema,
  HouseholdSchema,
  CommunicationSchema,
  LogisticsSchema,
  InventorySchema,
  LibraryManifestSchema,
  InstalledPacksSchema,
  RepoSchema,
  type Repo,
} from "@/lib/schemas/plan";

// ── Zone enforcement ─────────────────────────────────────────────────────────

export class ZoneWriteError extends Error {
  constructor(path: string) {
    super(
      `Cannot write to "${path}". Use "Fork to edit" to copy content to custom/ first.`,
    );
    this.name = "ZoneWriteError";
  }
}

export function assertWritable(path: string): void {
  if (path.startsWith("library/") || path.startsWith("packs/")) {
    throw new ZoneWriteError(path);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseYaml(content: string): Record<string, unknown> {
  try {
    const parsed = yaml.load(content);
    return (parsed && typeof parsed === "object" ? parsed : {}) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

function dumpYaml(data: unknown): string {
  return yaml.dump(data, { lineWidth: 120, noRefs: true });
}

// ── parseRepo ────────────────────────────────────────────────────────────────

export function parseRepo(files: Map<string, string>): Repo {
  const get = (key: string) => files.get(key) ?? "";

  // plan.yaml
  const planYamlRaw = parseYaml(get("plan.yaml"));
  const plan_yaml = PlanYamlSchema.parse({ ...planYamlRaw });
  // preserve unknown fields for round-trip
  const plan_yaml_with_extras = { ...planYamlRaw, ...plan_yaml };

  // plan/household/members.yaml
  const householdRaw = parseYaml(get("plan/household/members.yaml"));
  const household = HouseholdSchema.parse(
    Object.keys(householdRaw).length ? householdRaw : {},
  );

  // plan/communication/pace.yaml
  const commRaw = parseYaml(get("plan/communication/pace.yaml"));
  const communication = CommunicationSchema.parse(
    Object.keys(commRaw).length ? commRaw : {},
  );

  // plan/logistics/logistics.yaml
  const logisticsRaw = parseYaml(get("plan/logistics/logistics.yaml"));
  const logistics = LogisticsSchema.parse(
    Object.keys(logisticsRaw).length ? logisticsRaw : {},
  );

  // plan/inventory/inventory.yaml (combined) OR individual files
  const inventoryRaw = parseYaml(get("plan/inventory/inventory.yaml"));
  const goBagRaw = parseYaml(get("plan/inventory/go-bag.yaml"));
  const medsRaw = parseYaml(get("plan/inventory/medications.yaml"));
  const suppliesRaw = parseYaml(get("plan/inventory/home-supplies.yaml"));
  const inventoryCombined = Object.keys(inventoryRaw).length
    ? inventoryRaw
    : {
        go_bag: (goBagRaw.go_bag as unknown[]) ?? [],
        medications: (medsRaw.medications as unknown[]) ?? [],
        home_supplies: suppliesRaw.home_supplies ?? {},
      };
  const inventory = InventorySchema.parse(inventoryCombined);

  // library/library.yaml
  const libRaw = parseYaml(get("library/library.yaml"));
  const library_manifest = Object.keys(libRaw).length
    ? LibraryManifestSchema.parse(libRaw)
    : undefined;

  // packs/_installed.yaml
  const installedRaw = parseYaml(get("packs/_installed.yaml"));
  const installed_packs = InstalledPacksSchema.parse(
    Object.keys(installedRaw).length ? installedRaw : {},
  );

  const repo = RepoSchema.parse({
    plan_yaml: plan_yaml_with_extras,
    plan: { household, communication, logistics, inventory },
    library_manifest,
    installed_packs,
  });
  // Restore unknown fields stripped by Zod schema parsing
  return { ...repo, plan_yaml: plan_yaml_with_extras };
}

// ── serializeRepo ────────────────────────────────────────────────────────────

export function serializeRepo(repo: Repo): Map<string, string> {
  const files = new Map<string, string>();

  // plan.yaml
  files.set("plan.yaml", dumpYaml(repo.plan_yaml));

  // plan/household/members.yaml
  files.set(
    "plan/household/members.yaml",
    dumpYaml({ members: repo.plan.household.members }),
  );

  // plan/communication/pace.yaml
  files.set(
    "plan/communication/pace.yaml",
    dumpYaml({ tiers: repo.plan.communication.tiers }),
  );

  // plan/logistics/logistics.yaml
  files.set(
    "plan/logistics/logistics.yaml",
    dumpYaml({
      safe_rooms: repo.plan.logistics.safe_rooms,
      meeting_points: repo.plan.logistics.meeting_points,
      evacuation_routes: repo.plan.logistics.evacuation_routes,
    }),
  );

  // plan/inventory — split into separate files for human readability
  files.set(
    "plan/inventory/go-bag.yaml",
    dumpYaml({ go_bag: repo.plan.inventory.go_bag }),
  );
  files.set(
    "plan/inventory/medications.yaml",
    dumpYaml({ medications: repo.plan.inventory.medications }),
  );
  files.set(
    "plan/inventory/home-supplies.yaml",
    dumpYaml({ home_supplies: repo.plan.inventory.home_supplies }),
  );

  // library/library.yaml (if present)
  if (repo.library_manifest) {
    files.set("library/library.yaml", dumpYaml(repo.library_manifest));
  }

  // packs/_installed.yaml
  files.set("packs/_installed.yaml", dumpYaml(repo.installed_packs));

  return files;
}
