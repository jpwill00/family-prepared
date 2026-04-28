import { get, set, del } from "idb-keyval";
import { parseRepo, serializeRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

const REPO_KEY = "repo";
const FILES_KEY = "content_files";
const TOKEN_KEY = "github_token";
const SYNC_META_KEY = "github_sync_meta";

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

// ── GitHub token + sync metadata ──────────────────────────────────────────────

export interface SyncMeta {
  lastPullSha: string;
  lastSyncedAt: string;
  connectedRepo: string;
  connectedUser: string;
}

export async function saveToken(token: string): Promise<void> {
  await set(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return (await get<string>(TOKEN_KEY)) ?? null;
}

export async function clearToken(): Promise<void> {
  await del(TOKEN_KEY);
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await set(SYNC_META_KEY, meta);
}

export async function loadSyncMeta(): Promise<SyncMeta | null> {
  return (await get<SyncMeta>(SYNC_META_KEY)) ?? null;
}

export async function clearSyncMeta(): Promise<void> {
  await del(SYNC_META_KEY);
}
