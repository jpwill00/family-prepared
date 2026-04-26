# Content and Packs Patterns

Zone ownership rules, content type registry, and pack lifecycle for family-prepared.

## The Four Zones

| Zone | Path | Owner | GUI editable? | Updated by upgrade? | Exportable as pack? |
|------|------|-------|--------------|---------------------|---------------------|
| Plan | `plan/` | User | Yes | No | Sensitive — opt-in only |
| Library | `library/` | Template maintainers | "Fork to edit" | Yes, via template-sync | Whole library = one canonical pack |
| Packs | `packs/` | Pack authors | "Fork to edit" | Yes, per-pack version pin | Already a pack |
| Custom | `custom/` | User | Yes | Never | Yes — one click |

**Zone write rule**: Only `plan/` and `custom/` are directly writable. Writes to `library/` or `packs/` must first trigger a "Fork to edit" action that copies the content to `custom/<area>/`.

## Content Type Registry (`lib/content/registry.ts`)

Every top-level folder declares its `content_type` in `_meta.yaml` (or `library.yaml` / `pack.yaml`). The registry maps type → renderer:

```ts
// Built-in types at MVP
export const CONTENT_TYPES = {
  structured_record_set: StructuredRecordRenderer,  // plan/* (YAML forms)
  article_collection: ArticleCollectionRenderer,     // library/*, packs/*, custom/*
  geo_layer: GeoLayerRenderer,                       // GeoJSON map view
  checklist: ChecklistRenderer,                      // YAML list with check state
} as const;

// Fallback for unknown types
export const DEFAULT_RENDERER = ArticleCollectionRenderer;
```

**Adding a new `content_type` is a deliberate code change** — it requires:
1. New renderer component
2. New entry in `CONTENT_TYPES`
3. An ADR documenting the decision

**Adding a new folder of an existing type is a GUI action only** — no code change needed.

## `_meta.yaml` Format

```yaml
# plan/* and custom/*
content_type: structured_record_set   # or article_collection, geo_layer, checklist
title: Household
icon: users                            # lucide-react icon name

# library/* and packs/*/content/*
content_type: article_collection
title: Medical Reference
icon: heart-pulse
sources:
  - "FEMA CPG-101 v2"
last_reviewed: 2026-04-01
```

## Pack Manifest (`lib/packs/manifest.ts`)

```yaml
# packs/<id>/pack.yaml
id: wilderness-medicine-mit
version: 1.2.0
title: Wilderness Medicine Essentials
author:
  name: Jane Doe
  url: https://github.com/janedoe
license: CC-BY-4.0
sources: [...]
description: Field-applicable trauma and evacuation triage for non-clinicians.
content_areas:
  - { path: content/trauma-triage, content_type: article_collection }
requires:
  app_min_version: 0.2.0
checksum: sha256:abc123...
```

All fields validated with Zod in `lib/packs/manifest.ts`. `checksum` is set by the publish tool and verified on import.

## Pack Lifecycle (MVP)

| Action | Where |
|--------|-------|
| Import a `.zip` | `lib/packs/import.ts` → validates manifest → unpacks to `packs/<id>/` → records in `_installed.yaml` |
| Remove a pack | Delete directory + remove from `_installed.yaml` |
| Export `custom/<area>/` as pack | `lib/packs/export.ts` → wraps with `pack.yaml` → produces `.zip` |
| Browse registry | ⏳ Sprint 2 |
| Publish to GitHub | ⏳ Sprint 2 |

## `_installed.yaml` Lockfile

```yaml
# packs/_installed.yaml
installed:
  - id: wilderness-medicine-mit
    version: 1.2.0
    source: local-import           # or registry URL (Sprint 2)
    checksum: sha256:abc123...
    installed_at: 2026-04-20
```

## Article Frontmatter (library and packs)

```markdown
---
title: Bleeding Control Basics
content_type: article
sources:
  - "Stop the Bleed (American College of Surgeons)"
  - "FEMA CPG-101 Annex M"
last_reviewed: 2026-04-15
reviewer: <author>
---

Article body...
```

All library articles must have `sources` and `last_reviewed` fields. The `ArticleViewer` component renders these as a citations section.
