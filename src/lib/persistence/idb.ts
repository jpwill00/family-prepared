import { get, set, del } from "idb-keyval";
import { parseRepo, serializeRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

const REPO_KEY = "repo";

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
