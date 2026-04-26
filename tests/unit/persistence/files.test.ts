import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveFiles,
  loadFiles,
  clearFiles,
  mergeFiles,
  deleteFile,
} from "@/lib/persistence/idb";

const mockStore: Record<string, unknown> = {};

vi.mock("idb-keyval", () => ({
  get: vi.fn(async (key: string) => mockStore[key] ?? undefined),
  set: vi.fn(async (key: string, value: unknown) => { mockStore[key] = value; }),
  del: vi.fn(async (key: string) => { delete mockStore[key]; }),
}));

beforeEach(() => {
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  vi.clearAllMocks();
});

describe("saveFiles / loadFiles", () => {
  it("round-trips an empty map", async () => {
    await saveFiles(new Map());
    const loaded = await loadFiles();
    expect(loaded.size).toBe(0);
  });

  it("round-trips a populated map", async () => {
    const files = new Map([
      ["library/first-aid/bleeding.md", "# Bleeding\nApply pressure."],
      ["custom/pets/cats.md", "# Cats\nBring carrier."],
    ]);
    await saveFiles(files);
    const loaded = await loadFiles();
    expect(loaded.size).toBe(2);
    expect(loaded.get("library/first-aid/bleeding.md")).toBe("# Bleeding\nApply pressure.");
    expect(loaded.get("custom/pets/cats.md")).toBe("# Cats\nBring carrier.");
  });

  it("returns empty map when nothing stored", async () => {
    const loaded = await loadFiles();
    expect(loaded.size).toBe(0);
  });
});

describe("clearFiles", () => {
  it("removes all stored files", async () => {
    await saveFiles(new Map([["library/first-aid/test.md", "content"]]));
    await clearFiles();
    const loaded = await loadFiles();
    expect(loaded.size).toBe(0);
  });
});

describe("mergeFiles", () => {
  it("adds new files to existing store", async () => {
    await saveFiles(new Map([["library/first-aid/a.md", "A"]]));
    await mergeFiles(new Map([["library/water/b.md", "B"]]));
    const loaded = await loadFiles();
    expect(loaded.size).toBe(2);
    expect(loaded.get("library/first-aid/a.md")).toBe("A");
    expect(loaded.get("library/water/b.md")).toBe("B");
  });

  it("overwrites existing file with same path", async () => {
    await saveFiles(new Map([["library/first-aid/a.md", "old"]]));
    await mergeFiles(new Map([["library/first-aid/a.md", "new"]]));
    const loaded = await loadFiles();
    expect(loaded.get("library/first-aid/a.md")).toBe("new");
  });

  it("merges into empty store", async () => {
    await mergeFiles(new Map([["library/first-aid/a.md", "A"]]));
    const loaded = await loadFiles();
    expect(loaded.size).toBe(1);
  });
});

describe("deleteFile", () => {
  it("removes the specified file", async () => {
    await saveFiles(new Map([
      ["library/first-aid/a.md", "A"],
      ["library/first-aid/b.md", "B"],
    ]));
    await deleteFile("library/first-aid/a.md");
    const loaded = await loadFiles();
    expect(loaded.has("library/first-aid/a.md")).toBe(false);
    expect(loaded.has("library/first-aid/b.md")).toBe(true);
  });

  it("is a no-op when file does not exist", async () => {
    await saveFiles(new Map([["library/first-aid/a.md", "A"]]));
    await deleteFile("nonexistent.md");
    const loaded = await loadFiles();
    expect(loaded.size).toBe(1);
  });
});
