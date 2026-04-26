import JSZip from "jszip";
import yaml from "js-yaml";
import type { PackManifest } from "@/lib/packs/manifest";

export interface PackExportOptions {
  areaPath: string;
  files: Map<string, string>;
  packMeta: Pick<PackManifest, "id" | "version" | "title" | "license"> & Partial<PackManifest>;
}

export async function exportCustomAreaAsPack(options: PackExportOptions): Promise<Blob> {
  const { areaPath, files, packMeta } = options;
  const prefix = `${areaPath}/`;
  const zip = new JSZip();

  // Collect content_areas from the area files
  const contentAreas: Array<{ path: string; content_type: string }> = [];

  for (const [filePath, content] of files) {
    if (!filePath.startsWith(prefix)) continue;
    const relative = filePath.slice(prefix.length);
    if (relative === "_meta.yaml") continue;
    zip.file(relative, content);
  }

  // Read content_type from _meta.yaml if present
  const metaContent = files.get(`${areaPath}/_meta.yaml`);
  if (metaContent) {
    const meta = yaml.load(metaContent) as Record<string, unknown>;
    contentAreas.push({
      path: "content",
      content_type: (meta.content_type as string) ?? "article_collection",
    });
  }

  const manifest: PackManifest = {
    ...packMeta,
    content_areas: contentAreas.length ? contentAreas : [{ path: "content", content_type: "article_collection" }],
  };

  zip.file("pack.yaml", yaml.dump(manifest, { lineWidth: 120, noRefs: true }));

  return zip.generateAsync({ type: "blob" });
}
