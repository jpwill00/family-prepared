# ADR-006 — Content Registry and Pack Specification

**Date**: 2026-04-25  
**Status**: Accepted

## Context

Users need to be able to add new content areas (e.g., `pets-emergency/`, `elderly-care/`) without writing code. Different content areas need different rendering: a household member list renders differently from a Markdown article collection or a GeoJSON map layer.

Community knowledge sharing requires a portable, versioned bundle format that can be safely imported without overwriting user data.

## Decision

**Content Type Registry + Pack Specification**

### Content Type Registry

Each top-level folder has a `_meta.yaml` declaring its `content_type`. The app has a registry mapping `content_type` → renderer component.

Built-in types at MVP:
- `structured_record_set` — YAML-backed, GUI form editor (used by `plan/*`)
- `article_collection` — folder of Markdown files (used by `library/*`, `packs/*`, `custom/*`)
- `geo_layer` — GeoJSON rendered on a Leaflet map
- `checklist` — YAML list with resettable check state

**Key rules:**
- Adding a new folder of an existing type = GUI action (no code change)
- Adding a new `content_type` = code change + ADR required
- Unknown types fall back to `article_collection` renderer

### Pack Specification

A pack is a versioned ZIP with:
```
<id>/
  pack.yaml       ← manifest (id, version, title, author, license, content_areas, checksum)
  content/        ← Markdown articles or YAML files
  LICENSE
```

Checksum (`sha256:...`) is set by the publish tool and verified on import.

See `docs/pack-spec.md` for the full canonical spec.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Hard-coded folder types | Users couldn't add `pets-emergency/` without code change |
| Plugin system (npm packages) | Too technical; breaks no-terminal goal |
| Single renderer for all content | Poor UX for structured data (household members, checklists) |

## Consequences

- The app is extensible without code changes for the most common use case
- A bad `content_type` value in `_meta.yaml` degrades gracefully (fallback renderer)
- Pack format is stable from MVP — community packs built in Sprint 2 will be valid in Sprint 3+
- Pack checksums prevent tampering but not malicious content — content review is a Sprint 3+ concern
