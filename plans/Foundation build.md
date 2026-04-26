# family-prepared — Plan: Start to MVP

## Context

You want an open-source, offline-capable PWA that helps non-technical families build, version, and share their emergency-preparedness plans. The vision: users **copy a template repo** (GitHub "Use this template") and personalize it through a friendly GUI — adding household members, communication plans, evacuation routes, and resource inventories — without ever opening a terminal.

A core differentiator is **community knowledge sharing**: the template ships with a curated reference library of survival content (medical, shelter, water, fire, etc.), users can add their own content areas, and they can install/publish **resource packs** to share knowledge with each other.

The research doc (`research/Family Emergency Preparedness Software.md`) anchors the design:
- **Local-first PWA**: device is the source of truth; cloud sync is opportunistic.
- **Markdown + YAML** plan format: human-readable, machine-parsable, git-versionable.
- **PACE communication model** (Primary/Alternate/Contingency/Emergency).
- **OPSEC**: encryption + challenge-response codes for sensitive data.
- **Digital-analog bridge**: PDF export for printable hard copies.
- **Modular content verticals**: Household, Communication, Logistics, Inventory, Legal/Financial, plus reference content (medical, shelter, water, fire, navigation, comms, psychology, opsec).

The project lives at `/Users/jpw/Projects/family-prepared/` and is currently empty except for `research/` and `reppit-launch-prompt.md` (your RePPIT framework — Research → Planning → Prototyping → Implementation → Testing — with human review gates).

Two deliverables in this plan:
1. **Claude working files** (`CLAUDE.md` + `.claude/`) adapted from the `teachwithcolin` pattern, but stack-appropriate.
2. **Build plan to MVP** (Sprints 0 → 1) for the PWA itself.

Decisions confirmed up front (your answers):
- Stack: **Vite + React + TypeScript** (static-output, GitHub-Pages-native, lowest contributor barrier, no Node server assumed)
- Repo flow: **GitHub template + in-app GitHub OAuth** (read/commit via REST API)
- Scope: **Lean MVP** — core modules + offline shell + Markdown/YAML I/O + PDF export. No encryption, no PACE automation, no AI in MVP.
- Hosting: **GitHub Pages** for the demo + canonical template repo

---

## Recommended Architecture

```
┌─────────────────────────── Browser (PWA) ────────────────────────────┐
│                                                                       │
│   React UI (Tailwind + shadcn/ui)                                     │
│      │                                                                │
│      ▼                                                                │
│   Plan store (Zustand)  ◀─── reads/writes ──▶  IndexedDB (idb)        │
│      │                                                                │
│      ├──▶ Content registry — folder type → renderer mapping           │
│      │                                                                │
│      ├──▶ Markdown/YAML serializer (js-yaml + remark)                 │
│      │                                                                │
│      ├──▶ PDF exporter (@react-pdf/renderer)                          │
│      │                                                                │
│      ├──▶ ZIP / pack import + export (jszip)                          │
│      │                                                                │
│      └──▶ GitHub sync adapter (Octokit REST + OAuth Device Flow)      │
│                                                                       │
│   Service worker (vite-plugin-pwa / Workbox) — app shell + asset cache│
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                       GitHub.com (user's forked repo)
                       Canonical template: family-prepared-template
                       Future: family-prepared/registry (community packs)
```

**Why this layout**

- **IndexedDB as source of truth** matches the research's "Local-First Paradigm." The plan opens instantly offline; GitHub sync is an enhancement.
- **Markdown + YAML on disk** keeps the data portable, diff-able, and printable. The app is a *view* over those files, not a proprietary database.
- **Content registry** lets users add new top-level folders (`pets-emergency/`, `elderly-care/`) at runtime without code changes — the registry maps `content_type` → renderer.
- **GitHub OAuth Device Flow** avoids a backend: the PWA itself drives the OAuth dance. Public OAuth client_id is committed; no client_secret needed for Device Flow.
- **shadcn/ui + Tailwind** gives accessibility primitives (Radix under the hood) and a modern look without heavy CSS framework lock-in.
- **Workbox via vite-plugin-pwa** is the boring, proven path to installable PWA + offline shell.

---

## Data Shape on Disk (the user's forked repo)

The repo is organized into **four zones**, each with different ownership and update semantics. This separation is what makes the app extensible, shareable, and safe to upgrade.

```
family-prepared/
│
├── plan.yaml                          # Top-level metadata: name, version, last_updated,
│                                      # registered content_areas[], installed_packs[]
│
├── plan/                              ← ZONE 1 (GREEN): USER-OWNED PERSONAL PLAN
│   ├── household/                       (you edit this; never overwritten by upgrades)
│   │   ├── members.yaml
│   │   └── photos/
│   ├── communication/
│   │   ├── pace.yaml
│   │   └── README.md
│   ├── logistics/
│   │   ├── safe-rooms.yaml
│   │   ├── meeting-points.yaml
│   │   ├── evacuation-routes.geojson
│   │   └── README.md
│   ├── inventory/
│   │   ├── go-bag.yaml
│   │   ├── medications.yaml
│   │   └── home-supplies.yaml
│   └── legal/
│       └── README.md
│
├── library/                           ← ZONE 2 (BLUE): BUNDLED REFERENCE CONTENT
│   │                                    (ships with the template; updateable from upstream;
│   │                                     read-only in GUI by default — "fork to edit")
│   ├── medical/
│   │   ├── bleeding-control.md        # Sourced/cited (FEMA, Red Cross, public-domain mil)
│   │   ├── cpr-refresh.md
│   │   ├── medication-stockpiling.md
│   │   ├── pediatric-emergencies.md
│   │   └── _meta.yaml
│   ├── shelter/
│   │   ├── home-hardening.md
│   │   ├── tarp-shelter.md
│   │   ├── safe-room-design.md
│   │   └── _meta.yaml
│   ├── water/
│   │   ├── purification-methods.md
│   │   ├── storage-rotation.md
│   │   └── _meta.yaml
│   ├── fire/
│   │   ├── ignition-fundamentals.md
│   │   ├── stove-safety.md
│   │   └── _meta.yaml
│   ├── food/
│   │   ├── 72-hour-kit.md
│   │   ├── shelf-stable-planning.md
│   │   └── _meta.yaml
│   ├── navigation/
│   │   ├── map-and-compass.md
│   │   ├── mesh-radio-primer.md
│   │   └── _meta.yaml
│   ├── communications/
│   │   ├── pace-model-guide.md
│   │   ├── ham-radio-getting-started.md
│   │   └── _meta.yaml
│   ├── psychology/
│   │   ├── talking-with-children.md   # Per FEMA: critical first step
│   │   ├── stress-recovery.md
│   │   └── _meta.yaml
│   ├── opsec/
│   │   ├── challenge-response.md
│   │   ├── doc-protection.md
│   │   └── _meta.yaml
│   └── library.yaml                   # Manifest: version, sources_index, content_areas[]
│
├── packs/                             ← ZONE 3 (PURPLE): INSTALLED COMMUNITY PACKS
│   │                                    (each pack is a versioned bundle authored by the
│   │                                     user or a community member)
│   ├── wilderness-medicine-mit/
│   │   ├── pack.yaml                  # Manifest (id, version, author, license, sources)
│   │   ├── content/
│   │   │   └── ...
│   │   └── LICENSE
│   ├── pets-evacuation-aspca/
│   │   ├── pack.yaml
│   │   └── content/...
│   └── _installed.yaml                # Lockfile: pack_id → version, source, checksum
│
└── custom/                            ← ZONE 4 (YELLOW): USER-CREATED CONTENT
    │                                    (anything the user wants — fully personal,
    │                                     never overwritten by upgrades; can be exported as packs)
    ├── elderly-care/
    │   ├── _meta.yaml
    │   └── ...
    ├── special-needs-child/
    │   ├── _meta.yaml
    │   └── ...
    └── neighborhood-coordination/
        ├── _meta.yaml
        └── ...
```

### Why four zones, not one bag of folders

| Zone | Owner | Editable in GUI? | Updates from upstream? | Exportable as a pack? |
|---|---|---|---|---|
| `plan/` (green) | User | Yes | No (it's their data) | Sensitive — opt-in only |
| `library/` (blue) | Template maintainers | "Fork to edit" — clones to `custom/` first | Yes, via template-sync | Whole library is one canonical pack |
| `packs/` (purple) | Pack authors | "Fork to edit" — clones to `custom/` first | Yes, per-pack version pin | Already a pack |
| `custom/` (yellow) | User | Yes (full Markdown editor) | Never | Yes — one click → publishable pack |

### Content Type Registry — how the app knows what to render

Each top-level folder has a `_meta.yaml` (or `library.yaml`/`pack.yaml`) declaring its **content type**. The app has a registry of types and their renderers; unknown types fall back to "Markdown article list" rendering. **This is what lets users add `pets-emergency/` without code changes.**

```yaml
# Example: plan/household/_meta.yaml
content_type: structured_record_set
schema: household.members.v1
title: Household
icon: users

# Example: library/medical/_meta.yaml
content_type: article_collection
title: Medical Reference
icon: heart-pulse
sources:
  - "FEMA CPG-101 v2"
  - "Red Cross First Aid 2023"
last_reviewed: 2026-04-01

# Example: custom/pets-emergency/_meta.yaml
content_type: article_collection      # User picked from a dropdown
title: Pets — Emergency Care
icon: paw
```

Built-in `content_type` values at MVP:
- `structured_record_set` — YAML-backed, GUI form editor (used by `plan/*`)
- `article_collection` — folder of Markdown files with `_meta.yaml` (used by `library/*`, `packs/*`, `custom/*`)
- `geo_layer` — GeoJSON files rendered on a map
- `checklist` — YAML list with check state

Adding a new `content_type` is a code change. Adding a new **folder of an existing type** is a GUI action.

### Pack manifest format (`packs/<id>/pack.yaml`)

```yaml
id: wilderness-medicine-mit
version: 1.2.0
title: Wilderness Medicine Essentials (MIT OCW excerpts)
author:
  name: Jane Doe
  url: https://github.com/janedoe
license: CC-BY-4.0
sources:
  - "MIT OpenCourseWare HST.121, Lecture 7"
  - "Wilderness Medical Society Practice Guidelines 2024"
description: Field-applicable trauma and evacuation triage for non-clinicians.
content_areas:
  - { path: content/trauma-triage,  content_type: article_collection }
  - { path: content/evac-decision,  content_type: article_collection }
requires:
  app_min_version: 0.2.0
checksum: sha256:abc123...               # Set by the publish tool, verified on install
```

### Pack lifecycle (split between MVP and Sprint 2)

| Action | MVP? | Mechanism |
|---|---|---|
| Bundled library ships with template | ✅ Yes | `family-prepared-template` includes a populated `library/` |
| Add a new `custom/<area>/` folder | ✅ Yes | GUI: "+ New Content Area" → name, content_type, icon |
| Edit articles in `custom/` | ✅ Yes | Built-in Markdown editor |
| Import a pack from a `.zip` | ✅ Yes | "Import Pack" → drag zip → manifest validated → unpacked to `packs/<id>/` → recorded in `_installed.yaml` |
| Export a `custom/<area>/` as a publishable pack | ✅ Yes | "Export as Pack" → wraps with `pack.yaml` → produces `.zip` |
| Browse a community registry of packs | ⏳ Sprint 2 | JSON index in a public repo (`family-prepared/registry`); search + preview in app |
| One-click install from registry URL | ⏳ Sprint 2 | Fetch zip from manifest URL → reuses MVP import path |
| Update an installed pack to newer version | ⏳ Sprint 2 | Diff + accept; respects user's local edits |
| Publish a pack to GitHub directly | ⏳ Sprint 2 | Create a new repo with the pack contents via Octokit |
| Sign / verify packs | ⏳ Sprint 3+ | sigstore / cosign or PGP — when trust matters |

### Reference library seeding (Sprint 1, in the template repo)

`family-prepared-template` ships with `library/` populated by curated content from authoritative public-domain or permissively-licensed sources. Each article has a citations block:

```markdown
---
title: Bleeding Control Basics
content_type: article
sources:
  - "Stop the Bleed program (American College of Surgeons)"
  - "FEMA CPG-101 Annex M"
last_reviewed: 2026-04-15
reviewer: <author>
---
```

Initial seed scope: **2–4 articles per content area, ~10 areas, ~30 articles total**. Authored once by the project owner using public-domain sources (FEMA CPGs, military FM 21-76, Red Cross publications, ASPCA pet emergency guides). License: CC-BY-4.0 on the bundle.

---

## Repo Layout (the app itself)

```
family-prepared/                       (this directory — the PWA source)
├── CLAUDE.md                          ← single source of truth, ~150–200 lines
├── README.md                          ← user-facing (open-source contributors)
├── LICENSE                            ← MIT or Apache-2.0 (default MIT)
├── .editorconfig
├── .gitignore
├── .env.example                       ← VITE_GITHUB_CLIENT_ID, VITE_TEMPLATE_REPO,
│                                        VITE_REGISTRY_URL (Sprint 2)
├── .pre-commit-config.yaml
├── package.json
├── pnpm-lock.yaml                     ← pnpm preferred over npm
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── public/
│   ├── icon-192.png                   ← PWA icons
│   ├── icon-512.png
│   └── manifest.webmanifest           (auto-generated by vite-plugin-pwa)
├── src/
│   ├── main.tsx                       ← entry; registers SW
│   ├── App.tsx                        ← router shell
│   ├── routes/
│   │   ├── onboarding.tsx
│   │   ├── plan/household.tsx
│   │   ├── plan/communication.tsx
│   │   ├── plan/logistics.tsx
│   │   ├── plan/inventory.tsx
│   │   ├── library/index.tsx          ← list of library areas
│   │   ├── library/$area.tsx          ← article list within an area
│   │   ├── library/$area.$slug.tsx    ← single article view
│   │   ├── packs/index.tsx            ← installed packs + import button
│   │   ├── custom/index.tsx           ← user content areas + "new"
│   │   ├── custom/$area.tsx
│   │   ├── custom/$area.$slug.tsx     ← Markdown editor for user content
│   │   └── settings.tsx               ← export, GitHub sync, about
│   ├── components/
│   │   ├── ui/                        ← shadcn/ui primitives
│   │   ├── plan/MemberCard.tsx
│   │   ├── plan/PaceTierEditor.tsx
│   │   ├── plan/RouteMap.tsx          ← Leaflet
│   │   ├── library/ArticleViewer.tsx  ← Markdown + frontmatter renderer
│   │   ├── library/AreaCard.tsx
│   │   ├── packs/ImportDialog.tsx
│   │   ├── packs/ExportDialog.tsx
│   │   ├── custom/MarkdownEditor.tsx  ← textarea + preview (MVP); CodeMirror later
│   │   └── shared/AppShell.tsx
│   ├── lib/
│   │   ├── store/plan.ts              ← Zustand: full repo state
│   │   ├── persistence/idb.ts         ← idb-keyval
│   │   ├── persistence/yaml.ts        ← parse/serialize Markdown+YAML
│   │   ├── persistence/zip.ts         ← jszip whole-repo import/export
│   │   ├── persistence/pdf.tsx        ← @react-pdf/renderer document
│   │   ├── content/registry.ts        ← content_type → renderer
│   │   ├── content/types.ts           ← built-in content type definitions
│   │   ├── packs/manifest.ts          ← Zod schema for pack.yaml
│   │   ├── packs/import.ts            ← validate + unpack a .zip
│   │   ├── packs/export.ts            ← wrap a custom/ folder into a pack zip
│   │   ├── github/auth.ts             ← Device Flow OAuth (Sprint 2)
│   │   ├── github/sync.ts             ← Octokit read/commit (Sprint 2)
│   │   └── schemas/                   ← Zod schemas for plan/*, library, packs
│   ├── styles/index.css
│   └── types/plan.ts                  ← TS types derived from Zod
├── tests/
│   ├── unit/                          ← Vitest
│   ├── integration/                   ← repo round-trip, pack import/export
│   └── e2e/                           ← Playwright
├── scripts/
│   ├── pre-deploy-check.sh
│   └── seed-template-repo.ts          ← seeds family-prepared-template content
├── .claude/                           ← Claude Code working dir (see below)
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-pages.yml
│   │   └── auto-merge.yml
│   └── ISSUE_TEMPLATE/
└── docs/
    ├── research-synthesis.md
    ├── mvp-scope.md
    ├── sprint-plan.md
    ├── architecture.md
    ├── content-authoring-guide.md     ← how to write library/pack articles
    ├── pack-spec.md                   ← canonical spec for the pack format
    ├── adrs/
    │   ├── ADR-001-foundational-stack.md
    │   ├── ADR-002-local-first-storage.md
    │   ├── ADR-003-github-oauth-device-flow.md
    │   ├── ADR-004-markdown-yaml-data-format.md
    │   ├── ADR-005-four-zone-repo-structure.md
    │   └── ADR-006-content-registry-and-pack-spec.md
    ├── manual-test-plan.md
    └── post-mvp-backlog.md
```

A second repo will be created in Sprint 1:
- `family-prepared-template` — starter repo users copy via "Use this template." Contains the `plan/` skeleton (empty), the `library/` (seed-stocked), empty `packs/` and `custom/`, and a `plan.yaml`.

A third repo will be created in Sprint 2:
- `family-prepared/registry` — public JSON index of community packs. Just a flat repo with a generated `index.json` and per-pack metadata.

---

## CLAUDE.md Design (top-level)

Keep under ~200 lines (per the `claude-md-token-trim` skill). Mirror the `teachwithcolin` shape:

1. **Quick Links table** — every deep topic links to a `.claude/shared/*.md` file
2. **What This App Does** — 4 lines max
3. **Tech Stack** — table
4. **Critical Rules — Read Before Writing Any Code**:
   - Never push to `main` (PR-only with auto-merge)
   - Never use `--no-verify`
   - All persistence goes through `lib/persistence/*` — no `localStorage`/`IndexedDB` outside that module
   - All YAML schemas need a Zod schema in `lib/schemas/` AND a round-trip test
   - Service worker registration only in `main.tsx`
   - GitHub API access only via `lib/github/*`
   - Sensitive fields flagged with a `secure: true` marker (Sprint 2 picks up encryption)
   - **All zone writes respect ownership rules**: `plan/` and `custom/` are user-writeable; `library/` and `packs/` follow "fork to edit"
   - **Adding a new content_type is a deliberate code change** with an ADR; adding a folder is a GUI-only action
5. **Key File Paths** — annotated tree
6. **Data Flow** — ASCII diagram
7. **Common Commands** — pnpm scripts
8. **Environment Variables** — link to `.env.example`
9. **Git & Branch Conventions** — branch format, conventional commits
10. **CI/CD Workflow** — table of jobs (mirroring teachwithcolin)
11. **Test Suite** — how to run, what's covered
12. **Known Patterns to Watch For** — copy-paste antipatterns

## .claude/ Structure

```
.claude/
├── settings.json                      ← model, marketplaces, hooks
├── hooks/
│   └── retrospective-trigger.py       ← copied verbatim from teachwithcolin
└── shared/
    ├── react-vite-patterns.md         ← Vite + React conventions
    ├── tailwind-shadcn-patterns.md    ← Component & styling rules
    ├── persistence-patterns.md        ← IndexedDB, YAML, ZIP, PDF
    ├── content-and-packs-patterns.md  ← Zone rules, registry, pack lifecycle
    ├── github-sync-patterns.md        ← Octokit + Device Flow rules (Sprint 2)
    ├── pwa-service-worker-rules.md    ← service worker do/don't list
    ├── pr-workflow.md                 ← copy from teachwithcolin
    ├── git-commit-policy.md           ← copy + scope rename
    ├── output-style-guidelines.md     ← copy
    ├── tool-use-optimization.md       ← copy
    └── error-handling.md              ← copy, adapted to client-side
```

`.claude/settings.json` (sketch):

```json
{
  "model": "claude-sonnet-4-6",
  "alwaysThinkingEnabled": false,
  "cleanupPeriodDays": 30,
  "extraKnownMarketplaces": {
    "wshobson-agents": {
      "source": { "source": "github", "repo": "wshobson/agents", "path": ".claude-plugin/marketplace.json" }
    }
  },
  "enabledPlugins": {
    "frontend-mobile-development@wshobson-agents": true,
    "comprehensive-review@wshobson-agents": true,
    "error-debugging@wshobson-agents": true,
    "tdd-workflows@wshobson-agents": true,
    "git-pr-workflows@wshobson-agents": true,
    "accessibility-compliance@wshobson-agents": true
  },
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "(?i)(exit|quit|clear|done|finished|bye|goodbye|session)",
        "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/retrospective-trigger.py\"", "timeout": 5 }]
      }
    ]
  }
}
```

Plugin choices, justified:
- `frontend-mobile-development` — `frontend-developer` agent has explicit PWA + offline-first expertise
- `comprehensive-review` — `architect-review`, `code-reviewer`, `security-auditor` for human review gates
- `error-debugging` — `debugger`, `error-detective`
- `tdd-workflows` — Sprint 1 is TDD-driven for persistence, schema, and pack layers
- `git-pr-workflows` — PR template + auto-merge patterns
- `accessibility-compliance` — non-negotiable for non-technical users in emergency contexts

---

## Sprint Plan

### Sprint 0 — Scaffolding & Gates (1 work-day)

Goal: a clean, deployable nothing.

- [ ] `pnpm create vite@latest family-prepared --template react-ts`
- [ ] Add Tailwind + shadcn/ui init (button, dialog, form, input, label, card, dropdown-menu)
- [ ] Add `vite-plugin-pwa` with auto-update strategy
- [ ] Configure path aliases (`@/lib`, `@/components`, etc.)
- [ ] Add Vitest + React Testing Library + Playwright (smoke only)
- [ ] Add ESLint (`@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-jsx-a11y`)
- [ ] Add Prettier + pre-commit (`pre-commit-hooks` + `lefthook`)
- [ ] Write `CLAUDE.md` + populate `.claude/shared/` files
- [ ] Write six ADRs in `docs/adrs/` (incl. ADR-005 four-zone, ADR-006 pack spec)
- [ ] Author `docs/research-synthesis.md`, `docs/mvp-scope.md`, `docs/sprint-plan.md`, `docs/architecture.md`, `docs/pack-spec.md`, `docs/content-authoring-guide.md`
- [ ] `.github/workflows/ci.yml` — lint + typecheck + test + build
- [ ] `.github/workflows/deploy-pages.yml` — build → deploy
- [ ] `.github/workflows/auto-merge.yml`
- [ ] `.env.example` with `VITE_GITHUB_CLIENT_ID`, `VITE_TEMPLATE_REPO`, `VITE_REGISTRY_URL`
- [ ] LICENSE (MIT), CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md
- [ ] First deploy: blank "Hello, family-prepared" PWA installable from GitHub Pages

🛑 **GATE 1** — confirm scaffolding before writing feature code.

### Sprint 1 — MVP (1.5 to 2.5 weeks)

Goal: a usable, offline-first plan editor with a populated reference library, custom content areas, and ZIP-based pack import/export.

**1. Plan schema & persistence layer (TDD)**
- [ ] Zod schemas: `Plan`, `HouseholdMember`, `PaceTier`, `Contact`, `SafeRoom`, `MeetingPoint`, `EvacuationRoute`, `ChecklistItem`, `Medication`, `LibraryManifest`, `PackManifest`, `ContentAreaMeta`
- [ ] `lib/persistence/yaml.ts` — `parseRepo(files: Map<string, string>) → Repo` and `serializeRepo(repo: Repo) → Map<string, string>`
- [ ] `lib/persistence/idb.ts` — debounced writes
- [ ] `lib/persistence/zip.ts` — full-repo ZIP import/export
- [ ] Round-trip tests: zip → parse → mutate → serialize → zip; assert byte-equivalent for unchanged sections

**2. Content registry + zone enforcement**
- [ ] `lib/content/registry.ts` — built-in types: `structured_record_set`, `article_collection`, `geo_layer`, `checklist`
- [ ] Zone-write enforcement: writes outside `plan/` or `custom/` require an explicit "fork to edit" action that copies content to `custom/<area>/` first

**3. Pack subsystem (MVP slice)**
- [ ] `lib/packs/manifest.ts` — Zod for `pack.yaml`
- [ ] `lib/packs/import.ts` — validate + unpack a `.zip` into `packs/<id>/`, update `_installed.yaml`
- [ ] `lib/packs/export.ts` — wrap a `custom/<area>/` into a pack `.zip`
- [ ] Tests: import the seed library as a pack; round-trip; checksum verification

**4. App shell + routing**
- [ ] `AppShell` with sidebar (Plan / Library / Packs / Custom / Settings)
- [ ] Router (`react-router-dom` data routers)
- [ ] Onboarding flow: "Start with template" or "Import existing ZIP" or "Connect to GitHub" (third stubbed at MVP)

**5. Module: Household Identity** (zone: `plan/`)
- [ ] List + add/edit/delete members
- [ ] Fields per research doc: name, birth date, dietary, medical, photo
- [ ] Form-level Zod validation
- [ ] `data-secure="true"` attribute on sensitive inputs (lint rule)

**6. Module: Communication Plan** (zone: `plan/`)
- [ ] PACE tier editor (4 fixed tiers)
- [ ] Per-tier: list of contacts (name, role, channel, value)
- [ ] Free-text protocol README per tier
- [ ] Out-of-town contact slot (per FEMA)

**7. Module: Logistics** (zone: `plan/`)
- [ ] Safe rooms list (location, notes)
- [ ] Meeting points list (primary + alternate)
- [ ] Evacuation routes — Leaflet map view with GeoJSON read; manual paste at MVP

**8. Module: Resource Inventory** (zone: `plan/`)
- [ ] Go-bag checklist (resettable)
- [ ] Medications list (name, dose, frequency, expiration)
- [ ] Home supplies (water count, food days)
- [ ] Auto-suggested water target = `members × 1 gal/day × 3 days`

**9. Library viewer** (zone: `library/`, read-only)
- [ ] Index of areas from `library.yaml`
- [ ] Area page: list articles from `_meta.yaml`
- [ ] Article viewer: Markdown rendering with frontmatter, source citations
- [ ] "Fork to edit" button → copies article to `custom/<area>/` and routes there

**10. Packs viewer** (zone: `packs/`)
- [ ] Installed packs list (from `_installed.yaml`)
- [ ] Per-pack page: manifest, included content areas, link to source
- [ ] Import button (drag a `.zip` or pick a file) → validates manifest → unpacks
- [ ] Remove button (deletes the directory + lockfile entry)

**11. Custom content** (zone: `custom/`)
- [ ] "+ New Content Area" dialog: name, content_type (dropdown), icon
- [ ] Markdown editor (textarea + live preview) for `article_collection` types
- [ ] "Export as Pack" → wraps the area into a pack zip

**12. Export / printing**
- [ ] Whole-repo ZIP export (Settings)
- [ ] PDF export (Settings) covering `plan/*` + a chosen subset of library/custom areas; `@react-pdf/renderer`; "printed at" timestamp
- [ ] Both work fully offline

**13. Template repo seeding** (separate PR in `family-prepared-template`)
- [ ] Skeleton `plan/` (empty schemas)
- [ ] `library/` populated: 30 articles across 10 areas, fully cited
- [ ] `library.yaml`, `plan.yaml`, empty `packs/` + `custom/`
- [ ] `README.md` with one-paragraph instructions and a deep link to the deployed app

**14. PWA polish**
- [ ] Service worker caches app shell + Leaflet tiles for the user's region
- [ ] Manifest icons, theme color, display: standalone
- [ ] Install prompt UX
- [ ] "You are offline — local data still works" banner

**15. Tests**
- [ ] Unit: schema validation, YAML round-trip, water calculator, pack manifest validation, content registry resolver
- [ ] Integration: full repo parse → render → mutate → serialize roundtrip; pack import + remove; "fork to edit" flow
- [ ] One Playwright e2e: load app, add household member, install a sample pack, export ZIP, assert structure

**16. Deployment readiness**
- [ ] All env vars in `.env.example`
- [ ] Secrets scan clean
- [ ] Lighthouse: PWA installable, ≥90 a11y, ≥90 performance
- [ ] `docs/manual-test-plan.md` for the human reviewer

🛑 **GATE 2** — human tests MVP, approves before Sprint 2 begins.

### Sprint 2+ (Post-MVP backlog, ranked, deferred)

| Item | Trigger to address |
|---|---|
| GitHub OAuth Device Flow + read/commit sync | After MVP feedback confirms users want roundtrip; OAuth app registered |
| Community pack registry + browse/install UI | After ≥3 community-published packs exist outside the seed library |
| Pack updates with diff/accept (respect local edits) | Once any pack has a v2 |
| Pack publishing direct-to-GitHub | When users ask "how do I share?" without ZIP friction |
| Encryption of `secure: true` fields (Web Crypto AES-GCM) | When a pilot family wants to store SSNs/insurance numbers |
| GeoJSON drawing UI (leaflet-draw) | When pasted GeoJSON proves too technical |
| Challenge-response codes module | After encryption ships |
| Multi-device sync via GitHub commits | Same trigger as GitHub sync |
| AI plan generation + library-aware Q&A | When users hit "I don't know what to write" — instrument first |
| PACE auto-routing (network detection) | After users have any cell of contacts to route to |
| Pack signing / verification | When trust matters (e.g., a malicious pack is reported) |
| LoRa/mesh integration | Long horizon — needs hardware partner |
| Native packaging (Capacitor) | If iOS App Store presence is wanted |

Document this in `docs/post-mvp-backlog.md` at the end of Sprint 1.

---

## Critical Files to Create (in priority order)

| Path | Purpose | Source/Reference |
|---|---|---|
| `CLAUDE.md` | Project operating manual | adapted from `/tmp/teachwithcolin/CLAUDE.md` |
| `.claude/settings.json` | Model, plugins, hooks | adapted from `/tmp/teachwithcolin/.claude/settings.json` |
| `.claude/shared/git-commit-policy.md` | Commit rules | direct copy + scope rename |
| `.claude/shared/pr-workflow.md` | PR rules | direct copy |
| `.claude/shared/output-style-guidelines.md` | Voice | direct copy |
| `.claude/shared/tool-use-optimization.md` | Tool use | direct copy |
| `.claude/shared/error-handling.md` | Errors | adapt: client-side patterns |
| `.claude/shared/react-vite-patterns.md` | Stack rules | new |
| `.claude/shared/tailwind-shadcn-patterns.md` | UI rules | new |
| `.claude/shared/persistence-patterns.md` | IDB/YAML/ZIP/PDF | new |
| `.claude/shared/content-and-packs-patterns.md` | Zone rules + pack lifecycle | new |
| `.claude/shared/github-sync-patterns.md` | Octokit + OAuth | new (Sprint 2 fills) |
| `.claude/shared/pwa-service-worker-rules.md` | SW rules | new |
| `.claude/hooks/retrospective-trigger.py` | Session-end retro | direct copy |
| `package.json` | Stack | new (Sprint 0) |
| `vite.config.ts` | Bundler | new (Sprint 0) |
| `tailwind.config.ts` | UI | new (Sprint 0) |
| `.github/workflows/ci.yml` | CI | adapt teachwithcolin's |
| `.github/workflows/deploy-pages.yml` | Deploy | new |
| `docs/adrs/ADR-001-foundational-stack.md` | Stack decision | new |
| `docs/adrs/ADR-005-four-zone-repo-structure.md` | Zone architecture | new |
| `docs/adrs/ADR-006-content-registry-and-pack-spec.md` | Extensibility model | new |
| `docs/pack-spec.md` | Canonical pack format | new |
| `docs/content-authoring-guide.md` | How to write library/pack articles | new |
| `docs/research-synthesis.md` | Phase 1 deliverable | new |

---

## Reusable Patterns to Borrow

From `/tmp/teachwithcolin/`:
- `.claude/shared/git-commit-policy.md` — keep `--no-verify` prohibition; new scopes: `plan`, `library`, `packs`, `custom`, `persistence`, `ui`, `pwa`, `github`, `pdf`
- `.claude/shared/pr-workflow.md` — auto-merge gating logic
- `.claude/hooks/retrospective-trigger.py` — proven session-end pattern
- CLAUDE.md skeleton + Quick Links table format
- `ci.yml` job structure: `test`, `lint`, `pre-deploy`, `auto-merge`

From `/tmp/wshobson-agents/`:
- `frontend-developer` agent (PWA + service worker expertise) — invoke directly, don't write a custom one
- `architect-review.md` and `security-auditor.md` invoked at each gate
- `accessibility-compliance` plugin's a11y conventions

From ProjectMnemosyne skills:
- `claude-md-token-trim` discipline — CLAUDE.md ≤ 200 lines
- `claude-config-branch-audit` discipline — keep `.claude/` consistent with `package.json` scripts and tooling
- `flesh-out-scaffolded-repo` — Sprint 0 production-readiness checklist

---

## Verification

**End of Sprint 0:**
1. `pnpm install && pnpm dev` — blank app loads at localhost
2. `pnpm test` — passes (zero tests but the runner works)
3. `pnpm build` — produces `dist/` with `manifest.webmanifest` and a service worker
4. `pnpm lint && pnpm typecheck` — clean
5. PR opened, all CI jobs green, auto-merge fires
6. GitHub Pages serves the deployed app
7. Chrome "Install app" prompt appears, installed app opens offline
8. Open this directory in Claude — Quick Links work, no broken links

**End of Sprint 1 (MVP):**
1. Onboarding: choose "Start with template," repo seed loads
2. Add 4 family members; reload page; data persists
3. Add PACE tiers with 2 contacts each
4. Add 1 safe room, 2 meeting points, paste a small GeoJSON; map renders
5. Edit go-bag checklist, mark items, click "reset" — items uncheck
6. Add 2 medications with expiration dates
7. Open Library → Medical → "Bleeding Control"; article renders with citations
8. Click "Fork to edit" on an article → lands in `custom/medical/`; edit and save
9. Click "+ New Content Area" → create `pets-emergency` (article_collection); add a Markdown article
10. "Export as Pack" on `pets-emergency` → produces a valid `.zip` with `pack.yaml`
11. "Import Pack" → import the `.zip` you just produced; appears in Packs list
12. Settings → Export ZIP → unzip → confirm structure matches the four-zone tree; YAML round-trips via `pnpm test`
13. Settings → Export PDF → opens, plan + selected library + custom areas present
14. Disconnect network → reload → all routes functional, all data accessible
15. Lighthouse: PWA installable ✅, a11y ≥ 90, perf ≥ 90 (mobile)
16. `docs/manual-test-plan.md` checklist signed off by reviewer

---

## Open Questions Flagged for the Human

These shouldn't block Sprint 0 but should be answered before specific Sprint 1 tasks:

1. **OAuth client ID** — needs a GitHub OAuth app registered (Sprint 2). Stub `VITE_GITHUB_CLIENT_ID=replace_me` in MVP.
2. **Brand voice** — no `brand-voice.md` or `working-style.md` yet. Want a brief one before Sprint 0, or skip until Sprint 1 wraps?
3. **Template repo name** — `family-prepared-template` or something more public-facing (`family-prep-starter`)?
4. **License** — MIT (default) or Apache-2.0? Library content separately licensed CC-BY-4.0.
5. **Photo storage at MVP** — base64 in IndexedDB is fine for ≤10 members; on export becomes files in `plan/household/photos/`. OK?
6. **Library author** — who writes the seed library articles? (You? With AI assistance and human review?) This is real authoring work and should be planned as a parallel track during Sprint 1.
7. **Initial library scope** — 30 articles across 10 areas is the proposal. Smaller (15) acceptable for an even leaner MVP, or larger (50+) if you want a more impressive demo at launch.

Capture answers as comments in `docs/research-synthesis.md` once received.
