import { describe, it, expect, vi, beforeEach } from "vitest";
import { serializeRepo, parseRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

// Mock Octokit
const mockOctokit = {
  repos: {
    get: vi.fn(),
    getBranch: vi.fn(),
    createForAuthenticatedUser: vi.fn(),
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

import { readRepoTree, commitFiles, getRepoMeta, pushRepo, pullRepo, createPlanRepo } from "@/lib/github/sync";

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

describe("createPlanRepo", () => {
  const TOKEN = "gho_test";
  const REPO_NAME = "family-prepared-testuser";

  beforeEach(() => {
    vi.clearAllMocks();
    mockOctokit.users.getAuthenticated.mockResolvedValue({ data: { login: "testuser" } });
  });

  it("creates a private repo and returns RepoMeta", async () => {
    mockOctokit.repos.createForAuthenticatedUser.mockResolvedValue({});
    mockOctokit.repos.get.mockResolvedValue({ data: { default_branch: "main" } });
    mockOctokit.repos.getBranch.mockResolvedValue({ data: { commit: { sha: "init-sha" } } });

    const meta = await createPlanRepo(TOKEN, REPO_NAME);

    expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: REPO_NAME, private: true, auto_init: true }),
    );
    expect(meta.owner).toBe("testuser");
    expect(meta.repo).toBe(REPO_NAME);
    expect(meta.defaultBranch).toBe("main");
    expect(meta.latestSha).toBe("init-sha");
    expect(meta.login).toBe("testuser");
  });

  it("throws REPO_EXISTS error with nwo when repo name is already taken (422)", async () => {
    const conflictErr = Object.assign(new Error("Validation Failed"), { status: 422 });
    mockOctokit.repos.createForAuthenticatedUser.mockRejectedValue(conflictErr);

    await expect(createPlanRepo(TOKEN, REPO_NAME)).rejects.toThrow(
      `REPO_EXISTS:testuser/${REPO_NAME}`,
    );
  });

  it("throws scope error when GitHub returns 403 on repo creation", async () => {
    const scopeErr = Object.assign(new Error("Forbidden"), { status: 403 });
    mockOctokit.repos.createForAuthenticatedUser.mockRejectedValue(scopeErr);

    await expect(createPlanRepo(TOKEN, REPO_NAME)).rejects.toThrow(
      /permissions we need/,
    );
  });
});
