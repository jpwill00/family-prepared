// GitHub repo sync via Octokit — Sprint 2.
// All GitHub API calls go through this module.

export async function readRepoTree(
  _token: string,
  _repo: string,
): Promise<unknown> {
  throw new Error("GitHub sync not available until Sprint 2");
}

export async function commitFiles(
  _token: string,
  _repo: string,
  _files: Array<{ path: string; content: string }>,
): Promise<void> {
  throw new Error("GitHub sync not available until Sprint 2");
}
