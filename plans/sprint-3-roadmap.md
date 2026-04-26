# family-prepared — Build State + Sprint 3/4 Roadmap

> Companion to [`plans/Foundation build.md`](Foundation%20build.md). Picks up where Sprint 2 ends.

---

## 1. Build State Assessment

The Foundation plan defined Sprints 0 (scaffolding) and 1 (MVP), with a Sprint 2+ backlog. As of 2026-04-26, three sprint PRs have shipped to `main`:

| PR | Title | Scope |
|----|-------|-------|
| [#1](https://github.com/jpwill00/family-prepared/pull/1) | Sprint 0 + 1 MVP | Scaffolding, ADRs, CI, plan editor, ZIP I/O, content registry, packs |
| [#2](https://github.com/jpwill00/family-prepared/pull/2) | Sprint 2 PR 1 | Raw-files store, library rendering, custom Markdown editor |
| [#3](https://github.com/jpwill00/family-prepared/pull/3) | Sprint 2 PR 2+3 | Leaflet route map, PDF export, offline banner, install prompt, manual test plan |

**Test/build status**: 135 unit tests pass. `pnpm lint`, `pnpm typecheck`, `pnpm build` all clean.

### Status vs the Foundation plan

| Foundation Plan Item | Status | Evidence |
|----------------------|--------|----------|
| Sprint 0 scaffolding (Vite, Tailwind, shadcn, PWA, CI, ADRs) | ✅ Done | PR #1, [docs/sprint-plan.md](../docs/sprint-plan.md) |
| Sprint 1 MVP (plan editor, content registry, packs, ZIP I/O) | ✅ Done | PR #1, 103 tests |
| Sprint 2: library rendering + custom editor | ✅ Done | PR #2 |
| Sprint 2: Leaflet route map + PDF export | ✅ Done | PR #3 |
| Sprint 2: PWA polish (offline banner, install prompt) | ✅ Done | PR #3 |
| `docs/manual-test-plan.md` | ✅ Done | PR #3 |
| **Manual GATE 2 validation** | ⏳ **Pending — your turn** | See Section 2 |
| **Lighthouse audit (≥ 90 perf, ≥ 90 a11y)** | ⏳ **Pending — your turn** | See Section 2 |
| Separate `family-prepared-template` repo | ⏳ Sprint 3 PR 3 | Currently bundled as `public/seed-library.zip` |
| GitHub OAuth Device Flow + sync | ⏳ Sprint 3 PR 1 | [`src/lib/github/auth.ts`](../src/lib/github/auth.ts) — stubs |
| Encryption of `secure: true` fields | ⏳ Sprint 3 PR 2 | — |
| Community pack registry | ⏳ Sprint 4 | — |

**Summary**: feature-complete for the MVP scope defined in the Foundation plan. The next milestone — **GATE 2** — is human-driven acceptance testing. Once you sign off, we cut Sprint 3.

---

## 2. Manual GATE 2 Checklist (Your Instructions)

The Foundation plan put a 🛑 gate after Sprint 1: "human tests MVP, approves before Sprint 2 begins." We blew through that gate during Sprint 2 development, so this is a combined Sprint 1 + 2 acceptance test.

### Step 1 — Build and serve the production bundle

```bash
cd /Users/jpw/Projects/family-prepared
pnpm install
pnpm build
pnpm preview
```

Vite will print a URL (typically `http://localhost:4173`). Open it in **Chrome** (Lighthouse + install prompt require Chromium).

### Step 2 — Walk through the manual test plan

Open [`docs/manual-test-plan.md`](../docs/manual-test-plan.md) and execute sections **1 → 11** in order. There are 11 numbered areas:

1. First-run onboarding (3 flows: Start fresh, Import ZIP, GitHub stub)
2. Household page — add/edit/delete members
3. Communication plan — PACE tiers + contacts
4. Logistics — safe rooms, meeting points, evacuation routes (paste this GeoJSON to test the map):
   ```json
   {"type":"LineString","coordinates":[[-122.42,37.77],[-122.41,37.78],[-122.40,37.79]]}
   ```
5. Inventory — home supplies, medications, go-bag checklist
6. Library browsing — area cards, article rendering with citations
7. Custom content — new area, new article, live preview, fork from library, delete
8. ZIP export + reimport round-trip (clear data → reset → reimport → diff structure)
9. PDF export — verify ≥ 5 pages: cover, household + PACE, logistics, inventory, back page
10. Offline behavior — DevTools → Network → Offline → amber banner appears, app keeps working
11. PWA install — fresh Chrome profile → install card appears bottom-right; install → standalone window

For each section: note **PASS** or **FAIL: <one-line description>**.

### Step 3 — Lighthouse audit

In Chrome:
1. Open DevTools (Cmd+Opt+I)
2. Lighthouse tab
3. Mode: **Navigation**
4. Device: **Mobile**
5. Categories: all five
6. Click **Analyze page load**

Capture the four scores. Targets per the Foundation plan:
- Performance ≥ 90
- Accessibility ≥ 90
- Best Practices ≥ 90
- PWA: installable ✓

### Step 4 — Sign off

Open `docs/manual-test-plan.md` (or a new `docs/gate-2-signoff.md`) and append:

```markdown
## Gate 2 sign-off — YYYY-MM-DD

| Section | Status | Notes |
|---------|--------|-------|
| 1. Onboarding | PASS | |
| 2. Household | PASS | |
| ... | ... | ... |

### Lighthouse (Mobile)
- Performance: NN
- Accessibility: NN
- Best Practices: NN
- PWA: installable ✓

**Decision**: ☐ Proceed to Sprint 3   ☐ Block on bugs (see issues)
```

### Step 5 — Decision point

- **All pass** → Reply with "Gate 2 passed, start Sprint 3" and we'll cut PR 1 (`feat/s3-github-sync`).
- **Bugs found** → File each as a GitHub issue (`gh issue create`); small fixes ship as `fix/<short-desc>` PRs before Sprint 3.
- **Lighthouse < 90** → Note which category; we open a `perf/*` or `a11y/*` PR.

---

## 3. Sprint 3 Outline — Sync + Security

**Goal**: Multi-device sync via GitHub, plus passphrase-protected encryption for sensitive fields. Three PRs.

### PR 1 — GitHub OAuth Device Flow + read/commit sync

Branch: `feat/s3-github-sync` (cut from `main` after Gate 2 sign-off)

| Task | Notes |
|------|-------|
| Register GitHub OAuth app | jpwill00/family-prepared OAuth app; capture `client_id` |
| Wire `VITE_GITHUB_CLIENT_ID` | `.env.example`, GitHub Actions `env:` block |
| Implement `lib/github/auth.ts` | Device Flow per [ADR-003](../docs/adrs/ADR-003-github-oauth-device-flow.md): POST `/login/device/code`, poll `/login/oauth/access_token`, store token in IDB |
| Implement `lib/github/sync.ts` | Octokit REST: get tree, create blobs, create commit, update branch ref |
| Replace onboarding stub | [`src/routes/onboarding.tsx:149`](../src/routes/onboarding.tsx) "Connect GitHub" button → triggers Device Flow |
| Settings page additions | Connection status, manual push, manual pull, last-synced timestamp, disconnect button |
| Conflict UX | If remote SHA ≠ stored last-pull SHA: show 3-way diff, "Keep mine / Take theirs / Manual merge" |
| Tests | Mock Octokit; round-trip serializeRepo → push → pull → parseRepo; auth state machine |

### PR 2 — Web Crypto encryption for `secure: true` fields

Branch: `feat/s3-encryption` (cut from `main` after PR 1 merges)

| Task | Notes |
|------|-------|
| `lib/crypto/secure.ts` | AES-GCM via `crypto.subtle`; PBKDF2 key derivation (≥ 600,000 iterations per OWASP 2024); per-field random IV |
| Lock screen | On app open, if any `secure: true` field has ciphertext → passphrase modal; on success, decrypt in memory only |
| Schema audit | Tag `members[].ssn`, `members[].insurance`, `members[].medical_codes`, GitHub token (PR 1) as `secure: true` |
| Migration | Plaintext `secure: true` values → save triggers passphrase prompt → re-encrypt |
| Settings | Change passphrase, reset (deletes encrypted data) |
| Tests | Encrypt → decrypt round-trip, wrong-passphrase rejection, IV uniqueness, key-derivation iteration count |

### PR 3 — Template repo split

Branch: `chore/s3-template-repo` (cut from `main` after PR 2 merges)

| Task | Notes |
|------|-------|
| Create `jpwill00/family-prepared-template` | Public repo, MIT license; CC-BY-4.0 on library content |
| Migrate seed library | Move `scripts/build-seed-library.ts` output into the template repo as committed Markdown files |
| Cut a release | Tag `v1.0.0`, attach `seed-library.zip` as a release asset |
| Update onboarding | Fetch from `VITE_TEMPLATE_REPO` release URL instead of bundled `public/seed-library.zip` |
| Remove bundled seed | Delete `public/seed-library.zip` from PWA build (saves ~200 KB) |
| Add seed library refresh | "Update reference library" button in Settings (re-fetches from template repo, prompts before overwriting `library/`) |

---

## 4. Sprint 4 Outline — Community Knowledge Sharing

**Goal**: Browse, install, update, and publish community packs. Three PRs.

### PR 1 — Pack registry browse

Branch: `feat/s4-registry-browse`

- Create `family-prepared/registry` repo with `index.json` (pack id → url, version, sha256, license, content_areas)
- `lib/registry/client.ts` — fetch + cache index in IDB; revalidate on mount
- `/packs/registry` route: searchable list, filters (license, content_type, sources)
- "Install" button reuses existing [`lib/packs/import.ts`](../src/lib/packs/)

### PR 2 — Pack updates with diff/accept

Branch: `feat/s4-pack-updates`

- "Check for updates" button on `/packs` — compares each installed pack's version to registry
- Per-pack diff UI: show changed/added/removed files; "Accept all" or per-file selection
- Respect user's "Fork to edit" copies in `custom/` — never overwrite a fork

### PR 3 — Pack publishing direct-to-GitHub

Branch: `feat/s4-pack-publish` (requires Sprint 3 PR 1)

- "Publish to GitHub" button on `custom/<area>/` pages
- Octokit creates a new public repo in the user's account with the pack contents + generated `pack.yaml`
- "Submit to registry" — opens a PR against `family-prepared/registry` adding the new pack entry

---

## 5. Sprint 5+ — Deferred Items

Per [`docs/post-mvp-backlog.md`](../docs/post-mvp-backlog.md). Triggers required before each becomes worth doing:

| Item | Trigger |
|------|---------|
| Pack signing/verification | A malicious pack is reported, or trust requirements grow |
| Challenge-response codes module | After encryption (PR 2 above) ships |
| GeoJSON drawing UI (`leaflet-draw`) | When pasted GeoJSON proves too technical from user feedback |
| AI plan generation + library Q&A | Instrument first — when users hit "I don't know what to write" |
| PACE auto-routing (network detection) | After users have any cell of contacts to route to |
| LoRa/mesh integration | Long horizon — needs hardware partner |
| Native packaging (Capacitor) | If iOS App Store presence becomes a goal |
| Dark mode | User demand — CSS variables already in place |

---

## Reference

- Foundation plan: [`plans/Foundation build.md`](Foundation%20build.md)
- Manual test plan: [`docs/manual-test-plan.md`](../docs/manual-test-plan.md)
- Sprint 1+2 progress: [`docs/sprint-plan.md`](../docs/sprint-plan.md)
- Post-MVP backlog: [`docs/post-mvp-backlog.md`](../docs/post-mvp-backlog.md)
- ADRs: [`docs/adrs/`](../docs/adrs/)
