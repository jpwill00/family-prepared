import { describe, it, expect, vi, beforeEach } from "vitest";
import { serializeRepo, parseRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

// Mock Octokit
const mockOctokit = {
  repos: {
    get: vi.fn(),
    getBranch: vi.fn(),
  },
  git: {
    getTree: vi.fn(),
    getBlob: vi.fn(),
    createBlob: vi.fn(),
    createTree: vi.fn(),
    createCommit: vi.fn(),
    updateRef: vi.fn(),
  },
  users: {
    getAuthenticated: vi.fn(),
  },
};

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(() => mockOctokit),
}));

import { readRepoTree, commitFiles, getRepoMeta, pushRepo, pullRepo } from "@/lib/github/sync";

const TEST_REPO = "testowner/test-family-plan";
const TOKEN = "gho_test_token";

const EMPTY_REPO: Repo = {
  plan_yaml: { name: "Test Plan", version: "1.0.0", content_areas: [], installed_packs: [] },
  plan: {
    household: { members: [] },
    communication: { tiers: [] },
    logistics: { safe_rooms: [], meeting_points: [], evacuation_routes: [] },
    inventory: { go_bag: [], medications: [], home_supplies: { water_gallons: 0, food_days: 0 } },
  },
  installed_packs: { installed: [] },
};

function setupMocksForRead(files: Map<string, string>) {
  mockOctokit.repos.get.mockResolvedValue({ data: { default_branch: "main" } });
  mockOctokit.repos.getBranch.mockResolvedValue({
    data: { commit: { sha: "abc123", commit: { tree: { sha: "tree-sha-abc" } } } },
  });

  const treeItems = Array.from(files.entries()).map(([path]) => ({
    type: "blob",
    path,
    sha: `sha-${path}`,
  }));
  mockOctokit.git.getTree.mockResolvedValue({ data: { tree: treeItems } });

  mockOctokit.git.getBlob.mockImplementation(({ file_sha }: { file_sha: string }) => {
    const path = file_sha.replace("sha-", "");
    const content = files.get(path) ?? "";
    return Promise.resolve({
      data: { encoding: "utf-8", content },
    });
  });
}

function setupMocksForWrite() {
  mockOctokit.repos.get.mockResolvedValue({ data: { default_branch: "main" } });
  mockOctokit.repos.getBranch.mockResolvedValue({
    data: { commit: { sha: "parent-sha", commit: { tree: { sha: "base-tree-sha" } } } },
  });
  mockOctokit.git.createBlob.mockImplementation((_: unknown) =>
    Promise.resolve({ data: { sha: "blob-sha" } }),
  );
  mockOctokit.git.createTree.mockResolvedValue({ data: { sha: "new-tree-sha" } });
  mockOctokit.git.createCommit.mockResolvedValue({ data: { sha: "new-commit-sha" } });
  mockOctokit.git.updateRef.mockResolvedValue({});
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readRepoTree", () => {
  it("fetches plan files and returns a Map", async () => {
    const repoFiles = serializeRepo(EMPTY_REPO);
    setupMocksForRead(repoFiles);

    const result = await readRepoTree(TOKEN, TEST_REPO);

    expect(result).toBeInstanceOf(Map);
    expect(result.has("plan.yaml")).toBe(true);
    expect(result.has("plan/household/members.yaml")).toBe(true);
  });
});

describe("pullRepo", () => {
  it("round-trips: serialize → push files into tree → pull → parse back to same shape", async () => {
    const repoFiles = serializeRepo(EMPTY_REPO);
    setupMocksForRead(repoFiles);

    const pulled = await pullRepo(TOKEN, TEST_REPO);

    // Core plan structure should match
    expect(pulled.plan_yaml.name).toBe("Test Plan");
    expect(pulled.plan.household.members).toEqual([]);
    expect(pulled.plan.communication.tiers).toEqual([]);
  });
});

describe("commitFiles", () => {
  it("creates blobs, tree, commit, and updates ref", async () => {
    setupMocksForWrite();

    const sha = await commitFiles(TOKEN, TEST_REPO, [
      { path: "plan.yaml", content: "name: Test\n" },
    ]);

    expect(sha).toBe("new-commit-sha");
    expect(mockOctokit.git.createBlob).toHaveBeenCalledTimes(1);
    expect(mockOctokit.git.createTree).toHaveBeenCalled();
    expect(mockOctokit.git.createCommit).toHaveBeenCalled();
    expect(mockOctokit.git.updateRef).toHaveBeenCalled();
  });

  it("uses provided commit message", async () => {
    setupMocksForWrite();
    await commitFiles(TOKEN, TEST_REPO, [{ path: "plan.yaml", content: "" }], "test: custom message");

    expect(mockOctokit.git.createCommit).toHaveBeenCalledWith(
      expect.objectContaining({ message: "test: custom message" }),
    );
  });
});

describe("pushRepo", () => {
  it("serializes repo and commits all plan files", async () => {
    setupMocksForWrite();
    const expectedFileCount = serializeRepo(EMPTY_REPO).size;

    const sha = await pushRepo(TOKEN, TEST_REPO, EMPTY_REPO);

    expect(sha).toBe("new-commit-sha");
    expect(mockOctokit.git.createBlob).toHaveBeenCalledTimes(expectedFileCount);
  });
});

describe("getRepoMeta", () => {
  it("returns owner, repo, defaultBranch, latestSha, login", async () => {
    mockOctokit.repos.get.mockResolvedValue({ data: { default_branch: "main" } });
    mockOctokit.repos.getBranch.mockResolvedValue({ data: { commit: { sha: "meta-sha" } } });
    mockOctokit.users.getAuthenticated.mockResolvedValue({ data: { login: "testuser" } });

    const meta = await getRepoMeta(TOKEN, TEST_REPO);

    expect(meta.owner).toBe("testowner");
    expect(meta.repo).toBe("test-family-plan");
    expect(meta.defaultBranch).toBe("main");
    expect(meta.latestSha).toBe("meta-sha");
    expect(meta.login).toBe("testuser");
  });
});

describe("serializeRepo / parseRepo round-trip", () => {
  it("produces identical structure after serialize → parseRepo", () => {
    const files = serializeRepo(EMPTY_REPO);
    const parsed = parseRepo(files);

    expect(parsed.plan_yaml.name).toBe(EMPTY_REPO.plan_yaml.name);
    expect(parsed.plan.household).toEqual(EMPTY_REPO.plan.household);
    expect(parsed.plan.communication).toEqual(EMPTY_REPO.plan.communication);
    expect(parsed.plan.inventory).toEqual(EMPTY_REPO.plan.inventory);
  });
});
