import { create } from "zustand";
import { loadRepo, saveRepo, clearRepo as clearIdb } from "@/lib/persistence/idb";
import { RepoSchema } from "@/lib/schemas/plan";
import type { Repo, Household, Communication, Logistics, Inventory } from "@/lib/schemas/plan";

function emptyRepo(): Repo {
  return RepoSchema.parse({});
}

export interface PlanStore {
  repo: Repo | null;
  initialized: boolean;
  firstRun: boolean;

  initialize(): Promise<void>;
  setRepo(repo: Repo): Promise<void>;
  updateHousehold(household: Partial<Household>): Promise<void>;
  updateCommunication(communication: Partial<Communication>): Promise<void>;
  updateLogistics(logistics: Partial<Logistics>): Promise<void>;
  updateInventory(inventory: Partial<Inventory>): Promise<void>;
  reset(): Promise<void>;
}

export const usePlanStore = create<PlanStore>()((set, get) => ({
  repo: null,
  initialized: false,
  firstRun: false,

  async initialize() {
    if (get().initialized) return;
    const loaded = await loadRepo();
    set({ repo: loaded ?? emptyRepo(), initialized: true, firstRun: !loaded });
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

  async reset() {
    await clearIdb();
    set({ repo: emptyRepo() });
  },
}));
