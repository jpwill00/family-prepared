# Sprint Plan

## Sprint 0 — Scaffolding & Gates (1 work-day)

Goal: a clean, deployable nothing.

- [x] `pnpm create vite@latest . --template react-ts`
- [x] Add Tailwind + shadcn/ui init
- [x] Add `vite-plugin-pwa` with auto-update strategy
- [x] Configure path aliases (`@/`)
- [x] Add Vitest + React Testing Library + Playwright
- [x] Add ESLint + Prettier + lefthook
- [x] Write `CLAUDE.md` + populate `.claude/shared/` files
- [x] Write six ADRs in `docs/adrs/`
- [x] Author `docs/research-synthesis.md`, `docs/mvp-scope.md`, `docs/sprint-plan.md`, `docs/architecture.md`, `docs/pack-spec.md`, `docs/content-authoring-guide.md`
- [x] `.github/workflows/ci.yml` — lint + typecheck + test + build
- [x] `.github/workflows/deploy-pages.yml` — build → deploy
- [x] `.env.example`
- [x] LICENSE (MIT), CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md
- [ ] First deploy: blank "Hello, family-prepared" PWA on GitHub Pages
- [ ] `git init` + initial commit + push to GitHub

🛑 **GATE 1** — confirm scaffolding before writing feature code.

## Sprint 1 — MVP (1.5 to 2.5 weeks)

Goal: a usable, offline-first plan editor with reference library, custom content, and pack import/export.

### 1. Plan schema & persistence layer (TDD) ✅
- [x] Zod schemas: `Plan`, `HouseholdMember`, `PaceTier`, `Contact`, `SafeRoom`, `MeetingPoint`, `EvacuationRoute`, `ChecklistItem`, `Medication`, `LibraryManifest`, `PackManifest`, `ContentAreaMeta`
- [x] `lib/persistence/yaml.ts` — `parseRepo` / `serializeRepo` (19 tests)
- [x] `lib/persistence/idb.ts` — `saveRepo` / `loadRepo` / `clearRepo` (12 tests)
- [x] `lib/persistence/zip.ts` — full-repo ZIP import/export (11 tests)
- [x] Round-trip tests — all passing

### 2. Content registry + zone enforcement ✅
- [x] `lib/content/registry.ts` — renderer map + `getRenderer()` (10 tests)
- [x] Zone-write enforcement in `lib/persistence/yaml.ts` (ZoneWriteError)

### 3. Pack subsystem (MVP slice) ✅
- [x] `lib/packs/manifest.ts` — PackManifestSchema (Zod)
- [x] `lib/packs/import.ts` — validate + unpack ZIP (15 tests)
- [x] `lib/packs/export.ts` — custom area → ZIP pack

### 4. App shell + routing ✅
- [x] `AppShell` with zone-colored sidebar
- [x] Router with all 13 routes (lazy-loaded)
- [x] Onboarding flow: Start fresh / Import ZIP / GitHub stub
- [x] Zustand store with IDB hydration (9 tests)
- [x] `firstRun` detection → redirect to onboarding

### 5. Module: Household Identity ✅
- [x] Member list with avatar initials
- [x] Add/edit/delete member dialog (react-hook-form + Zod)
- [x] Age calculation from birth_date
- [x] Dietary + medical notes

### 6. Module: Communication Plan ✅
- [x] PACE tier layout (Primary → Alternate → Contingency → Emergency)
- [x] Add/edit/delete contacts per tier
- [x] Protocol notes editable per tier

### 7. Module: Logistics ✅
- [x] Safe rooms CRUD
- [x] Meeting points CRUD (primary/alternate type badge)
- [x] Evacuation routes CRUD (map stub for Sprint 2)

### 8. Module: Resource Inventory ✅
- [x] Go-bag checklist with check/uncheck + progress
- [x] Medications table with CRUD dialog
- [x] Home supplies: water gallons + food days
- [x] Water calculator (days = gallons / member count)

### 9. Library viewer ✅
- [x] Library index from manifest (empty state with instructions)
- [x] Area page (stub for content import)
- [x] Article page (stub)

### 10. Packs viewer ✅
- [x] Installed packs list
- [x] Import pack from ZIP (with validation errors shown)
- [x] Remove installed pack

### 11. Custom content ✅
- [x] Custom index empty state
- [x] Area/article stubs with breadcrumb nav

### 12. Export ✅
- [x] ZIP export in Settings (download .zip backup)
- [x] Plan name editor in Settings
- [x] Reset all data (danger zone, with confirmation)
- [ ] PDF export — planned Sprint 2

### 13. Template repo seeding
- [ ] Separate PR (Sprint 2)

### 14. PWA polish
- [ ] Offline banner component
- [ ] Install prompt UX

### 15. Tests — 103 tests passing ✅
- [x] 8 test files, 103 tests, all green
- [x] Typecheck clean
- [x] Lint clean
- [x] Build clean (code-split, PWA SW generated)

### 16. Deployment readiness
- [ ] Lighthouse audit ≥90 a11y + performance
- [ ] `docs/manual-test-plan.md`
- [ ] Initial commit + push to GitHub

🛑 **GATE 2** — human tests MVP, approves before Sprint 2 begins.

## Sprint 2+ (Post-MVP)

See `docs/post-mvp-backlog.md`.
