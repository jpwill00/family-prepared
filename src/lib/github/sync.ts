// GitHub repo sync via Octokit — all GitHub API calls go through this module.

import { Octokit } from "@octokit/rest";
import { serializeRepo, parseRepo } from "@/lib/persistence/yaml";
import type { Repo } from "@/lib/schemas/plan";

// Paths that belong to the plan (synced to/from GitHub)
const PLAN_PATHS = [
  "plan.yaml",
  "plan/household/members.yaml",
  "plan/communication/pace.yaml",
  "plan/logistics/logistics.yaml",
  "plan/inventory/go-bag.yaml",
  "plan/inventory/medications.yaml",
  "plan/inventory/home-supplies.yaml",
  "packs/_installed.yaml",
];

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  latestSha: string;
  login: string;
}

export async function getRepoMeta(token: string, nwoRepo: string): Promise<RepoMeta> {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = nwoRepo.split("/");

  const [repoRes, userRes] = await Promise.all([
    octokit.repos.get({ owner, repo }),
    octokit.users.getAuthenticated(),
  ]);

  const branch = repoRes.data.default_branch;
  const branchRes = await octokit.repos.getBranch({ owner, repo, branch });

  return {
    owner,
    repo,
    defaultBranch: branch,
    latestSha: branchRes.data.commit.sha,
    login: userRes.data.login,
  };
}

export async function readRepoTree(token: string, nwoRepo: string): Promise<Map<string, string>> {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = nwoRepo.split("/");

  // Get default branch HEAD sha
  const repoRes = await octokit.repos.get({ owner, repo });
  const branch = repoRes.data.default_branch;
  const branchRes = await octokit.repos.getBranch({ owner, repo, branch });
  const treeSha = branchRes.data.commit.commit.tree.sha;

  // Fetch full recursive tree
  const treeRes = await octokit.git.getTree({ owner, repo, tree_sha: treeSha, recursive: "1" });

  const planFiles = treeRes.data.tree.filter(
    (item) => item.type === "blob" && item.path && PLAN_PATHS.includes(item.path),
  );

  // Fetch all blobs in parallel
  const entries = await Promise.all(
    planFiles.map(async (item) => {
      const blobRes = await octokit.git.getBlob({ owner, repo, file_sha: item.sha! });
      const content =
        blobRes.data.encoding === "base64"
          ? atob(blobRes.data.content.replace(/\n/g, ""))
          : blobRes.data.content;
      return [item.path!, content] as const;
    }),
  );

  return new Map(entries);
}

export async function pullRepo(token: string, nwoRepo: string): Promise<Repo> {
  const files = await readRepoTree(token, nwoRepo);
  return parseRepo(files);
}

export async function commitFiles(
  token: string,
  nwoRepo: string,
  files: Array<{ path: string; content: string }>,
  message = "chore: sync plan via family-prepared",
): Promise<string> {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = nwoRepo.split("/");

  // Get current HEAD
  const repoRes = await octokit.repos.get({ owner, repo });
  const branch = repoRes.data.default_branch;
  const branchRes = await octokit.repos.getBranch({ owner, repo, branch });
  const parentSha = branchRes.data.commit.sha;
  const baseTreeSha = branchRes.data.commit.commit.tree.sha;

  // Create blobs
  const blobs = await Promise.all(
    files.map((f) =>
      octokit.git.createBlob({ owner, repo, content: f.content, encoding: "utf-8" }).then((r) => ({
        path: f.path,
        sha: r.data.sha,
      })),
    ),
  );

  // Create tree
  const treeRes = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: blobs.map(({ path, sha }) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      sha,
    })),
  });

  // Create commit
  const commitRes = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: treeRes.data.sha,
    parents: [parentSha],
  });

  // Update branch ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commitRes.data.sha,
  });

  return commitRes.data.sha;
}

export async function pushRepo(
  token: string,
  nwoRepo: string,
  repo: Repo,
  message?: string,
): Promise<string> {
  const files = serializeRepo(repo);
  const fileArray = Array.from(files.entries()).map(([path, content]) => ({ path, content }));
  return commitFiles(token, nwoRepo, fileArray, message);
}

/**
 * Create a new private GitHub repo for the user's plan data.
 * - Uses auto_init so the repo has an initial commit (required for subsequent pushes).
 * - Throws a descriptive error if the name is already taken (422) or scope is missing (403).
 * - Returns RepoMeta in the same shape as getRepoMeta.
 */
export async function createPlanRepo(token: string, name: string): Promise<RepoMeta> {
  const octokit = new Octokit({ auth: token });

  let login: string;
  try {
    const userRes = await octokit.users.getAuthenticated();
    login = userRes.data.login;
  } catch {
    throw new Error("GitHub didn't grant the permissions we need; please re-authorize.");
  }

  try {
    await octokit.repos.createForAuthenticatedUser({
      name,
      private: true,
      auto_init: true,
      description: "Family Prepared — emergency plan data",
    });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 422) {
      throw new Error(`REPO_EXISTS:${login}/${name}`, { cause: err });
    }
    if (status === 403) {
      throw new Error("GitHub didn't grant the permissions we need; please re-authorize.", { cause: err });
    }
    throw err;
  }

  // Get the newly created repo's metadata
  const repoRes = await octokit.repos.get({ owner: login, repo: name });
  const branch = repoRes.data.default_branch;
  const branchRes = await octokit.repos.getBranch({ owner: login, repo: name, branch });

  return {
    owner: login,
    repo: name,
    defaultBranch: branch,
    latestSha: branchRes.data.commit.sha,
    login,
  };
}

/**
 * Derive the default suggested backup repo name for a user.
 * Returns `family-prepared-{username}`.
 */
export async function getSuggestedRepoName(token: string): Promise<string> {
  const octokit = new Octokit({ auth: token });
  const userRes = await octokit.users.getAuthenticated();
  return `family-prepared-${userRes.data.login}`;
}
