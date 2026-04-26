import JSZip from "jszip";
import { parseRepo, serializeRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

export async function exportRepoAsZip(repo: Repo): Promise<Blob> {
  const files = serializeRepo(repo);
  const zip = new JSZip();
  for (const [path, content] of files) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: "blob" });
}

export async function importRepoFromZip(file: File): Promise<Repo> {
  const zip = await JSZip.loadAsync(file);

  if (!zip.file("plan.yaml")) {
    throw new Error("Invalid backup: plan.yaml not found in ZIP");
  }

  const files = new Map<string, string>();
  await Promise.all(
    Object.entries(zip.files)
      .filter(([, entry]) => !entry.dir)
      .map(async ([path, entry]) => {
        files.set(path, await entry.async("string"));
      }),
  );

  return parseRepo(files);
}
