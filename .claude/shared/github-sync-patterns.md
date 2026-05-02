# GitHub Sync Patterns

All GitHub API access goes through `src/lib/github/`:

- `lib/github/auth.ts` — Device Flow OAuth (no backend; public OAuth client_id only)
- `lib/github/sync.ts` — Octokit REST: read/write repo tree, create repos

## Device Flow OAuth (`lib/github/auth.ts`)

GitHub OAuth Device Flow allows a pure SPA to authenticate without a backend or client secret.
`VITE_GITHUB_CLIENT_ID` holds the public OAuth app client ID (scope: `repo`).

### Flow summary

1. `startDeviceFlow()` → POST to `https://github.com/login/device/code` → returns `DeviceFlowState` (user_code, verification_uri, expires_in, interval)
2. UI shows user_code + verification_uri; user visits `github.com/login/device`
3. `pollForToken(state, signal?)` → loops `pollOnce()` until token, expiry, or abort
4. On success, token stored in IDB via `saveToken()` — never in localStorage

### API surface

```ts
// lib/github/auth.ts
export async function startDeviceFlow(): Promise<DeviceFlowState>
export async function pollOnce(state: DeviceFlowState): Promise<PollResult>
export async function pollForToken(state: DeviceFlowState, signal?: AbortSignal): Promise<string | null>
export async function getStoredToken(): Promise<string | null>
export async function revokeToken(): Promise<void>
```

`PollResult` union: `{ status: "authorized"; token }` | `"pending"` | `"slow_down"; interval` | `"expired"` | `"error"; message`

### Polling loop implementation notes

- Respect the `interval` from `slow_down` responses — GitHub will block the app if polling too fast
- `pollForToken` checks `signal?.aborted` before and after each `sleep()` — passes `AbortController.signal` from the UI cancel button
- Expiry is enforced with a `Date.now() + expires_in * 1000` deadline

---

## Sync Operations (`lib/github/sync.ts`)

### API surface

```ts
export async function getRepoMeta(token: string, nwoRepo: string): Promise<RepoMeta>
export async function readRepoTree(token: string, nwoRepo: string): Promise<Map<string, string>>
export async function pullRepo(token: string, nwoRepo: string): Promise<Repo>
export async function commitFiles(token: string, nwoRepo: string, files: FileChange[], message?: string): Promise<string>
export async function pushRepo(token: string, nwoRepo: string, repo: Repo, message?: string): Promise<string>
export async function createPlanRepo(token: string, name: string): Promise<RepoMeta>
export async function getSuggestedRepoName(token: string): Promise<string>
```

### Octokit commit pattern

All commits use the low-level Git Data API (not the Contents API) to batch files efficiently:

```ts
// 1. Get HEAD sha + base tree sha
const branch = await octokit.repos.getBranch({ owner, repo, branch });
const parentSha = branch.data.commit.sha;
const baseTreeSha = branch.data.commit.commit.tree.sha;
// 2. Create blobs in parallel
const blobs = await Promise.all(files.map(f => octokit.git.createBlob(...)));
// 3. Create tree
const tree = await octokit.git.createTree({ base_tree: baseTreeSha, tree: blobs });
// 4. Create commit
const commit = await octokit.git.createCommit({ tree: tree.data.sha, parents: [parentSha] });
// 5. Update ref
await octokit.git.updateRef({ ref: `heads/${branch}`, sha: commit.data.sha });
```

### Auto-create backup repo (`createPlanRepo`)

Added in Sprint 4 (PR 2). Creates a new private GitHub repo for the user's plan data:

- Uses `auto_init: true` so the repo has an initial commit (required before first push)
- 422 → throws `Error("REPO_EXISTS:{owner}/{name}")` — caller shows "use it or rename" message
- 403 → throws scope error — caller prompts re-authorization
- Returns `RepoMeta` in the same shape as `getRepoMeta`
- `getSuggestedRepoName(token)` returns `family-prepared-{username}` as the default name shown to the user

### Synced file paths

```ts
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
```

---

## Rules

- All GitHub API calls go through `lib/github/sync.ts` or `lib/github/auth.ts` — never call Octokit directly from components
- Token lifecycle (store, load, revoke) is managed entirely in `lib/github/auth.ts` via `lib/persistence/idb.ts`
- Sync failures must degrade gracefully — local IndexedDB data remains the source of truth
- Never commit sensitive fields (`secure: true`) to GitHub without encryption (requires passphrase set)
- `nwoRepo` format is always `owner/repo` — never just the repo name

## Conflict Detection

`SyncMeta.lastPullSha` is compared with the remote HEAD SHA before a push. If they differ, the UI should warn the user ("remote has changes — pull first"). Current implementation is last-write-wins; UI conflict resolution is a future feature.
