# GitHub Sync Patterns

> **Sprint 2 stub.** GitHub sync (Octokit + Device Flow OAuth) is not in the MVP.
> This file will be filled in when Sprint 2 begins.

## Planned Architecture

All GitHub API access goes through `src/lib/github/`:

- `lib/github/auth.ts` — Device Flow OAuth (no backend; public OAuth client_id only)
- `lib/github/sync.ts` — Octokit REST: read repo tree, commit files

## Device Flow (planned)

GitHub OAuth Device Flow allows a pure SPA to authenticate without a backend or client secret. The `VITE_GITHUB_CLIENT_ID` env var holds the public OAuth app client ID.

Flow summary:
1. App POSTs to `https://github.com/login/device/code`
2. User visits `github.com/login/device` and enters the user code
3. App polls `https://github.com/login/oauth/access_token`
4. On success, store token in `idb-keyval` (encrypted in Sprint 3+)

ADR-003 covers this decision.

## Rules (to enforce in Sprint 2)

- All GitHub API calls go through `lib/github/sync.ts` — never call Octokit directly from components
- `lib/github/auth.ts` manages token lifecycle (store, refresh, revoke)
- Sync failures must degrade gracefully — local data remains the source of truth
- Never commit sensitive fields (`secure: true`) to GitHub without encryption (Sprint 3)

## Stub API Surface

```ts
// lib/github/auth.ts
export async function startDeviceFlow(): Promise<DeviceFlowState>
export async function pollForToken(state: DeviceFlowState): Promise<string | null>
export async function getStoredToken(): Promise<string | null>
export async function revokeToken(): Promise<void>

// lib/github/sync.ts
export async function readRepoTree(token: string, repo: string): Promise<RepoTree>
export async function commitFiles(token: string, repo: string, files: FileChange[]): Promise<void>
```
