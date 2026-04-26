# Architecture

## System Overview

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
│                                    [Sprint 2]                         │
│   Service worker (vite-plugin-pwa / Workbox) — app shell + asset cache│
└───────────────────────────────────────────────────────────────────────┘
                                  │ [Sprint 2]
                                  ▼
                       GitHub.com (user's forked repo)
                       Canonical template: family-prepared-template
                       Future: family-prepared/registry (community packs)
```

## Data Flow

```
User action (form, button)
        │
        ▼
Zustand store (src/lib/store/plan.ts)
        │
        ├── subscribes to changes → debounced write → IndexedDB
        │
        ├── content registry → renderer selection → React render
        │
        ├── serialize → ZIP export / GitHub commit [S2]
        │
        └── serialize → PDF export
```

## Four-Zone Repo Structure

See [ADR-005](adrs/ADR-005-four-zone-repo-structure.md).

```
user-repo/
├── plan.yaml            ← top-level metadata
├── plan/                ← ZONE 1: user-owned personal plan (never overwritten)
│   ├── household/
│   ├── communication/
│   ├── logistics/
│   └── inventory/
├── library/             ← ZONE 2: curated reference library (updateable)
│   ├── medical/
│   ├── shelter/
│   ├── water/ ...
│   └── library.yaml
├── packs/               ← ZONE 3: installed community packs (versioned)
│   ├── <pack-id>/
│   └── _installed.yaml
└── custom/              ← ZONE 4: user-created content (never overwritten)
    └── <area>/
```

## Module Boundaries

| Module | Responsibility | May import |
|--------|---------------|-----------|
| `src/lib/persistence/` | All I/O (IndexedDB, YAML, ZIP, PDF) | External libs only |
| `src/lib/store/plan.ts` | Global state | `lib/persistence/` |
| `src/lib/content/` | Type registry + rendering decisions | None (data only) |
| `src/lib/packs/` | Pack manifest + import/export logic | `lib/persistence/` |
| `src/lib/schemas/` | Zod schemas + derived TS types | `zod` only |
| `src/lib/github/` | Octokit + Device Flow | `lib/persistence/` |
| `src/components/` | UI rendering | `lib/store/`, `lib/content/`, `components/ui/` |
| `src/routes/` | Pages + data loading | `lib/store/`, `components/` |

## Key Technology Decisions

| Decision | ADR |
|----------|-----|
| Vite + React + TypeScript | [ADR-001](adrs/ADR-001-foundational-stack.md) |
| IndexedDB local-first | [ADR-002](adrs/ADR-002-local-first-storage.md) |
| GitHub Device Flow OAuth | [ADR-003](adrs/ADR-003-github-oauth-device-flow.md) |
| Markdown + YAML format | [ADR-004](adrs/ADR-004-markdown-yaml-data-format.md) |
| Four-zone repo structure | [ADR-005](adrs/ADR-005-four-zone-repo-structure.md) |
| Content registry + pack spec | [ADR-006](adrs/ADR-006-content-registry-and-pack-spec.md) |
