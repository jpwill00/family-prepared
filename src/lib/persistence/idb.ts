import { get, set, del } from "idb-keyval";
import { parseRepo, serializeRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

const REPO_KEY = "repo";
const FILES_KEY = "content_files";

// ── Structured repo (plan data) ───────────────────────────────────────────────

export async function saveRepo(repo: Repo): Promise<void> {
  const files = serializeRepo(repo);
  const plain: Record<string, string> = {};
  for (const [k, v] of files) plain[k] = v;
  await set(REPO_KEY, plain);
}

export async function loadRepo(): Promise<Repo | null> {
  const stored = await get<Record<string, string>>(REPO_KEY);
  if (!stored) return null;
  const files = new Map(Object.entries(stored));
  return parseRepo(files);
}

export async function clearRepo(): Promise<void> {
  await del(REPO_KEY);
}

// ── Raw content files (library/*, custom/* markdown) ─────────────────────────

export async function saveFiles(files: Map<string, string>): Promise<void> {
  const plain: Record<string, string> = {};
  for (const [k, v] of files) plain[k] = v;
  await set(FILES_KEY, plain);
}

export async function loadFiles(): Promise<Map<string, string>> {
  const stored = await get<Record<string, string>>(FILES_KEY);
  if (!stored) return new Map();
  return new Map(Object.entries(stored));
}

export async function clearFiles(): Promise<void> {
  await del(FILES_KEY);
}

export async function mergeFiles(updates: Map<string, string>): Promise<void> {
  const existing = await loadFiles();
  for (const [k, v] of updates) existing.set(k, v);
  await saveFiles(existing);
}

export async function deleteFile(path: string): Promise<void> {
  const existing = await loadFiles();
  existing.delete(path);
  await saveFiles(existing);
}
