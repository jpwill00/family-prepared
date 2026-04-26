# ADR-004 — Markdown + YAML Data Format

**Date**: 2026-04-25  
**Status**: Accepted

## Context

The user's plan data and reference library must be:
- Human-readable without a GUI (viewable in any text editor / GitHub UI)
- Machine-parsable (the app reads and writes it)
- Git-versionable (meaningful diffs in PRs)
- Printable (PDF export)
- Portable (ZIP import/export for sharing)

## Decision

**Markdown + YAML frontmatter for articles; pure YAML for structured records.**

- Articles (`library/`, `packs/`, `custom/`): Markdown files with YAML frontmatter (`---` blocks)
- Structured records (`plan/`): pure YAML files (e.g., `members.yaml`, `go-bag.yaml`)
- All YAML deserialized with `js-yaml`; Markdown rendered with `remark`
- All schemas validated with **Zod** at read time

```
plan/household/members.yaml       ← pure YAML list
library/medical/bleeding.md       ← Markdown with frontmatter
packs/wilderness/trauma-triage.md ← Markdown with frontmatter
```

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| JSON | Less readable; poor diff/merge in Git; no inline comments |
| SQLite | Not human-readable; not diff-able |
| Proprietary binary format | Violates portability goal |
| TOML | Less familiar than YAML for the target audience |

## Consequences

- `serializeRepo` / `parseRepo` must round-trip perfectly — unknown YAML fields are preserved
- PDF export derives its content from the same YAML/Markdown source
- Contributes to the "digital-analog bridge": the same data that drives the GUI produces the printable PDF
