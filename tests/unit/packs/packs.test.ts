import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  PackValidationError,
  importPackFromZip,
} from "@/lib/packs/import";
import { exportCustomAreaAsPack } from "@/lib/packs/export";

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_MANIFEST_YAML = `
id: wilderness-medicine
version: 1.0.0
title: Wilderness Medicine Essentials
license: CC-BY-4.0
content_areas:
  - path: content/trauma-triage
    content_type: article_collection
`.trim();

const VALID_MANIFEST_WITH_VERSION_YAML = `
id: new-pack
version: 1.0.0
title: New Pack
license: MIT
requires:
  app_min_version: 0.1.0
content_areas:
  - path: content
    content_type: article_collection
`.trim();

async function makePackZip(overrides?: {
  manifestYaml?: string | null;
  extraFiles?: Record<string, string>;
}): Promise<File> {
  const zip = new JSZip();
  const manifest = overrides?.manifestYaml !== undefined
    ? overrides.manifestYaml
    : VALID_MANIFEST_YAML;
  if (manifest !== null) {
    zip.file("pack.yaml", manifest);
  }
  zip.file("content/trauma-triage/intro.md", "# Intro\n\nBasic triage concepts.");
  zip.file("content/trauma-triage/bleeding-control.md", "# Bleeding Control\n\nApply pressure.");
  if (overrides?.extraFiles) {
    for (const [path, content] of Object.entries(overrides.extraFiles)) {
      zip.file(path, content);
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return new File([blob], "wilderness-medicine-1.0.0.zip", { type: "application/zip" });
}

// ── importPackFromZip ────────────────────────────────────────────────────────

describe("importPackFromZip", () => {
  it("returns manifest from a valid pack ZIP", async () => {
    const file = await makePackZip();
    const result = await importPackFromZip(file);
    expect(result.manifest.id).toBe("wilderness-medicine");
    expect(result.manifest.version).toBe("1.0.0");
    expect(result.manifest.title).toBe("Wilderness Medicine Essentials");
  });

  it("returns file map from a valid pack ZIP", async () => {
    const file = await makePackZip();
    const result = await importPackFromZip(file);
    expect(result.files.size).toBeGreaterThan(0);
  });

  it("file paths are prefixed with packs/<id>/", async () => {
    const file = await makePackZip();
    const result = await importPackFromZip(file);
    for (const path of result.files.keys()) {
      expect(path).toMatch(/^packs\/wilderness-medicine\//);
    }
  });

  it("file map includes content files from the ZIP", async () => {
    const file = await makePackZip();
    const result = await importPackFromZip(file);
    expect(result.files.has("packs/wilderness-medicine/content/trauma-triage/intro.md")).toBe(true);
  });

  it("throws PackValidationError when pack.yaml is missing", async () => {
    const file = await makePackZip({ manifestYaml: null });
    await expect(importPackFromZip(file)).rejects.toThrow(PackValidationError);
    await expect(importPackFromZip(file)).rejects.toThrow(/pack\.yaml/);
  });

  it("throws PackValidationError for non-kebab-case id", async () => {
    const file = await makePackZip({
      manifestYaml: VALID_MANIFEST_YAML.replace("wilderness-medicine", "Wilderness Medicine"),
    });
    await expect(importPackFromZip(file)).rejects.toThrow(PackValidationError);
  });

  it("throws PackValidationError for invalid semver", async () => {
    const file = await makePackZip({
      manifestYaml: VALID_MANIFEST_YAML.replace("1.0.0", "v1.0"),
    });
    await expect(importPackFromZip(file)).rejects.toThrow(PackValidationError);
  });

  it("throws PackValidationError for unsupported app_min_version", async () => {
    const file = await makePackZip({
      manifestYaml: VALID_MANIFEST_YAML + "\nrequires:\n  app_min_version: 99.0.0",
    });
    await expect(importPackFromZip(file)).rejects.toThrow(PackValidationError);
    await expect(importPackFromZip(file)).rejects.toThrow(/app_min_version/);
  });

  it("accepts pack with compatible app_min_version", async () => {
    const file = await makePackZip({ manifestYaml: VALID_MANIFEST_WITH_VERSION_YAML });
    const result = await importPackFromZip(file);
    expect(result.manifest.id).toBe("new-pack");
  });

  it("throws on non-ZIP file", async () => {
    const file = new File(["not a zip"], "plan.zip", { type: "application/zip" });
    await expect(importPackFromZip(file)).rejects.toThrow();
  });
});

// ── exportCustomAreaAsPack ────────────────────────────────────────────────────

describe("exportCustomAreaAsPack", () => {
  const AREA_FILES = new Map([
    ["custom/my-pets-guide/_meta.yaml", "content_type: article_collection\ntitle: My Pets Guide\n"],
    ["custom/my-pets-guide/dogs.md", "# Dogs\n\nCare for dogs in emergencies."],
    ["custom/my-pets-guide/cats.md", "# Cats\n\nCare for cats in emergencies."],
  ]);

  const EXPORT_OPTIONS = {
    areaPath: "custom/my-pets-guide",
    files: AREA_FILES,
    packMeta: {
      id: "my-pets-guide",
      version: "1.0.0",
      title: "My Pets Guide",
      license: "CC-BY-4.0",
    },
  };

  it("returns a Blob", async () => {
    const blob = await exportCustomAreaAsPack(EXPORT_OPTIONS);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("ZIP contains pack.yaml", async () => {
    const blob = await exportCustomAreaAsPack(EXPORT_OPTIONS);
    const zip = await JSZip.loadAsync(blob);
    expect(zip.file("pack.yaml")).not.toBeNull();
  });

  it("pack.yaml contains required fields", async () => {
    const blob = await exportCustomAreaAsPack(EXPORT_OPTIONS);
    const zip = await JSZip.loadAsync(blob);
    const content = await zip.file("pack.yaml")!.async("string");
    expect(content).toContain("my-pets-guide");
    expect(content).toContain("1.0.0");
    expect(content).toContain("My Pets Guide");
    expect(content).toContain("CC-BY-4.0");
  });

  it("ZIP contains content files from the area (without custom/ prefix)", async () => {
    const blob = await exportCustomAreaAsPack(EXPORT_OPTIONS);
    const zip = await JSZip.loadAsync(blob);
    const files = Object.keys(zip.files);
    expect(files).toContain("dogs.md");
    expect(files).toContain("cats.md");
  });

  it("pack.yaml validates against PackManifestSchema", async () => {
    const blob = await exportCustomAreaAsPack(EXPORT_OPTIONS);
    const zip = await JSZip.loadAsync(blob);
    const content = await zip.file("pack.yaml")!.async("string");
    const yaml = (await import("js-yaml")).default;
    const { PackManifestSchema } = await import("@/lib/packs/manifest");
    const parsed = PackManifestSchema.safeParse(yaml.load(content));
    expect(parsed.success).toBe(true);
  });
});
