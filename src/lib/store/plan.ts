import { create } from "zustand";
import {
  loadRepo,
  saveRepo,
  clearRepo as clearIdb,
  loadFiles,
  saveFiles,
  clearFiles,
  deleteFile as idbDeleteFile,
} from "@/lib/persistence/idb";
import { RepoSchema } from "@/lib/schemas/plan";
import type { Repo, Household, Communication, Logistics, Inventory } from "@/lib/schemas/plan";

function emptyRepo(): Repo {
  return RepoSchema.parse({});
}

export interface PlanStore {
  repo: Repo | null;
  initialized: boolean;
  firstRun: boolean;
  rawFiles: Map<string, string>;
  /** Derived in memory from passphrase — never persisted to IDB. */
  cryptoKey: CryptoKey | null;

  initialize(): Promise<void>;
  setRepo(repo: Repo): Promise<void>;
  updateHousehold(household: Partial<Household>): Promise<void>;
  updateCommunication(communication: Partial<Communication>): Promise<void>;
  updateLogistics(logistics: Partial<Logistics>): Promise<void>;
  updateInventory(inventory: Partial<Inventory>): Promise<void>;
  setCryptoKey(key: CryptoKey | null): void;
  reset(): Promise<void>;

  // Raw content file operations
  getFile(path: string): string | null;
  setFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(prefix: string): string[];
}

export const usePlanStore = create<PlanStore>()((set, get) => ({
  repo: null,
  initialized: false,
  firstRun: false,
  rawFiles: new Map(),
  cryptoKey: null,

  async initialize() {
    if (get().initialized) return;
    const [loaded, files] = await Promise.all([loadRepo(), loadFiles()]);
    set({ repo: loaded ?? emptyRepo(), initialized: true, firstRun: !loaded, rawFiles: files });
  },

  async setRepo(repo) {
    set({ repo });
    await saveRepo(repo);
  },

  async updateHousehold(household) {
    const current = get().repo ?? emptyRepo();
    const updated: Repo = {
      ...current,
      plan: { ...current.plan, household: { ...current.plan.household, ...household } },
    };
    await get().setRepo(updated);
  },

  async updateCommunication(communication) {
    const current = get().repo ?? emptyRepo();
    const updated: Repo = {
      ...current,
      plan: { ...current.plan, communication: { ...current.plan.communication, ...communication } },
    };
    await get().setRepo(updated);
  },

  async updateLogistics(logistics) {
    const current = get().repo ?? emptyRepo();
    const updated: Repo = {
      ...current,
      plan: { ...current.plan, logistics: { ...current.plan.logistics, ...logistics } },
    };
    await get().setRepo(updated);
  },

  async updateInventory(inventory) {
    const current = get().repo ?? emptyRepo();
    const updated: Repo = {
      ...current,
      plan: { ...current.plan, inventory: { ...current.plan.inventory, ...inventory } },
    };
    await get().setRepo(updated);
  },

  setCryptoKey(key) {
    set({ cryptoKey: key });
  },

  async reset() {
    await Promise.all([clearIdb(), clearFiles()]);
    set({ repo: emptyRepo(), rawFiles: new Map(), cryptoKey: null });
  },

  getFile(path) {
    return get().rawFiles.get(path) ?? null;
  },

  async setFile(path, content) {
    const next = new Map(get().rawFiles);
    next.set(path, content);
    set({ rawFiles: next });
    await saveFiles(next);
  },

  async deleteFile(path) {
    const next = new Map(get().rawFiles);
    next.delete(path);
    set({ rawFiles: next });
    await idbDeleteFile(path);
  },

  listFiles(prefix) {
    return [...get().rawFiles.keys()]
      .filter((p) => p.startsWith(prefix))
      .sort();
  },
}));
