import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePlanStore } from "@/lib/store/plan";

const mockStore: Record<string, unknown> = {};

vi.mock("idb-keyval", () => ({
  get: vi.fn(async (key: string) => mockStore[key] ?? undefined),
  set: vi.fn(async (key: string, value: unknown) => { mockStore[key] = value; }),
  del: vi.fn(async (key: string) => { delete mockStore[key]; }),
}));

beforeEach(() => {
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  vi.clearAllMocks();
  usePlanStore.setState({
    repo: null,
    initialized: false,
    firstRun: false,
    rawFiles: new Map(),
  });
});

describe("getFile", () => {
  it("returns null when file does not exist", () => {
    expect(usePlanStore.getState().getFile("library/first-aid/a.md")).toBeNull();
  });

  it("returns content when file exists", async () => {
    await usePlanStore.getState().setFile("library/first-aid/a.md", "# Test");
    expect(usePlanStore.getState().getFile("library/first-aid/a.md")).toBe("# Test");
  });
});

describe("setFile", () => {
  it("persists file to IDB and updates state", async () => {
    await usePlanStore.getState().setFile("custom/pets/cats.md", "# Cats");
    expect(usePlanStore.getState().rawFiles.has("custom/pets/cats.md")).toBe(true);
    expect(usePlanStore.getState().rawFiles.get("custom/pets/cats.md")).toBe("# Cats");
  });

  it("overwrites existing file", async () => {
    await usePlanStore.getState().setFile("custom/pets/cats.md", "original");
    await usePlanStore.getState().setFile("custom/pets/cats.md", "updated");
    expect(usePlanStore.getState().getFile("custom/pets/cats.md")).toBe("updated");
  });
});

describe("deleteFile", () => {
  it("removes the file from state", async () => {
    await usePlanStore.getState().setFile("custom/pets/cats.md", "# Cats");
    await usePlanStore.getState().deleteFile("custom/pets/cats.md");
    expect(usePlanStore.getState().rawFiles.has("custom/pets/cats.md")).toBe(false);
  });

  it("is a no-op when file does not exist", async () => {
    await usePlanStore.getState().setFile("custom/pets/cats.md", "# Cats");
    await usePlanStore.getState().deleteFile("nonexistent.md");
    expect(usePlanStore.getState().rawFiles.size).toBe(1);
  });
});

describe("listFiles", () => {
  it("returns files matching prefix, sorted", async () => {
    await usePlanStore.getState().setFile("library/first-aid/bleeding.md", "A");
    await usePlanStore.getState().setFile("library/first-aid/burns.md", "B");
    await usePlanStore.getState().setFile("library/water/storage.md", "C");
    await usePlanStore.getState().setFile("custom/pets/cats.md", "D");

    const result = usePlanStore.getState().listFiles("library/first-aid/");
    expect(result).toEqual([
      "library/first-aid/bleeding.md",
      "library/first-aid/burns.md",
    ]);
  });

  it("returns empty array when no files match prefix", () => {
    expect(usePlanStore.getState().listFiles("library/nonexistent/")).toEqual([]);
  });

  it("returns all files when prefix is empty string", async () => {
    await usePlanStore.getState().setFile("library/first-aid/a.md", "A");
    await usePlanStore.getState().setFile("custom/pets/b.md", "B");
    expect(usePlanStore.getState().listFiles("").length).toBe(2);
  });
});
