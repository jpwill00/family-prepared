// Fetches the seed reference library ZIP.
// Tries the latest GitHub release first; falls back to the bundled copy.

import JSZip from "jszip";

const TEMPLATE_REPO = import.meta.env.VITE_TEMPLATE_REPO as string | undefined;
const BUNDLED_PATH = "/seed-library.zip";

async function fetchZipFrom(url: string): Promise<Map<string, string> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const zip = await JSZip.loadAsync(blob);
    const files = new Map<string, string>();
    await Promise.all(
      Object.entries(zip.files)
        .filter(([path, entry]) => path.startsWith("library/") && !entry.dir)
        .map(async ([path, entry]) => {
          files.set(path, await entry.async("string"));
        }),
    );
    return files.size > 0 ? files : null;
  } catch {
    return null;
  }
}

function releaseAssetUrl(nwoRepo: string): string {
  const [owner, repo] = nwoRepo.split("/");
  return `https://github.com/${owner}/${repo}/releases/latest/download/seed-library.zip`;
}

/**
 * Returns library files from the template repo's latest release,
 * falling back to the bundled /seed-library.zip if the network fetch fails.
 * Returns null only if both sources fail.
 */
export async function fetchSeedLibrary(): Promise<Map<string, string> | null> {
  // Try remote release first
  if (TEMPLATE_REPO) {
    const remote = await fetchZipFrom(releaseAssetUrl(TEMPLATE_REPO));
    if (remote) return remote;
  }

  // Fall back to bundled copy
  return fetchZipFrom(BUNDLED_PATH);
}
