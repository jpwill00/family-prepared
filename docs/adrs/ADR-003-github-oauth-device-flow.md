# ADR-003 — GitHub OAuth Device Flow

**Date**: 2026-04-25  
**Status**: Accepted (Sprint 2 implementation)

## Context

Sprint 2 adds GitHub sync: reading the user's repo tree and committing plan changes back to their GitHub fork. A pure SPA cannot store OAuth client secrets securely. Standard OAuth authorization code flow requires a redirect URI and backend to exchange the code for a token.

## Decision

**GitHub OAuth Device Flow** — no backend required; the public `client_id` is committed to the repo.

Flow:
1. App POSTs to `https://github.com/login/device/code` with `client_id` and `scope`
2. GitHub returns a `user_code` and `verification_uri`
3. App shows the user code and instructs the user to visit `github.com/login/device`
4. App polls `https://github.com/login/oauth/access_token` until authorized
5. Token stored in IndexedDB (encrypted in Sprint 3+)

The `client_id` is public — it's safe to commit. Device Flow doesn't use a `client_secret`.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Standard OAuth code flow | Requires backend to hold client_secret |
| GitHub Apps | More complex; requires installation flow |
| Personal Access Token | Poor UX; users don't know how to generate one |
| GitHub CLI proxy | Requires local software; defeats no-terminal goal |

## Consequences

- `VITE_GITHUB_CLIENT_ID` is public — no secrets in the codebase ✅
- Requires the user to briefly visit GitHub to authorize — one-time setup
- Token lifetime is long-lived; stored in IndexedDB pending Sprint 3 encryption
- Scope needed: `repo` (read + write to user's fork)
