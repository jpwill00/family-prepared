import JSZip from "jszip";
import yaml from "js-yaml";
import { PackManifestSchema, type PackManifest } from "@/lib/packs/manifest";

export class PackValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackValidationError";
  }
}

export interface ImportedPack {
  manifest: PackManifest;
  files: Map<string, string>;
}

const APP_VERSION = "0.1.0";

function semverGte(version: string, minVersion: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [mj, mn, pt] = parse(version);
  const [rmj, rmn, rpt] = parse(minVersion);
  if (mj !== rmj) return mj > rmj;
  if (mn !== rmn) return mn > rmn;
  return pt >= rpt;
}

export async function importPackFromZip(file: File): Promise<ImportedPack> {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file("pack.yaml");
  if (!manifestFile) {
    throw new PackValidationError("Invalid pack: pack.yaml not found in ZIP");
  }

  const manifestText = await manifestFile.async("string");
  const manifestRaw = yaml.load(manifestText);
  const parsed = PackManifestSchema.safeParse(manifestRaw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new PackValidationError(`Invalid pack manifest: ${issue.message} (${issue.path.join(".")})`);
  }

  const manifest = parsed.data;

  const minVersion = manifest.requires?.app_min_version;
  if (minVersion && !semverGte(APP_VERSION, minVersion)) {
    throw new PackValidationError(
      `Pack requires app_min_version ${minVersion} but current version is ${APP_VERSION}`,
    );
  }

  const files = new Map<string, string>();
  await Promise.all(
    Object.entries(zip.files)
      .filter(([path, entry]) => !entry.dir && path !== "pack.yaml")
      .map(async ([path, entry]) => {
        files.set(`packs/${manifest.id}/${path}`, await entry.async("string"));
      }),
  );

  return { manifest, files };
}
