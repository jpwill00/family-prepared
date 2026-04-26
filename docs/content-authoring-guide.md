# Content Authoring Guide

How to write articles for the `library/`, `packs/`, and `custom/` zones.

## Article Frontmatter

Every Markdown article must have YAML frontmatter:

```markdown
---
title: Bleeding Control Basics
content_type: article
sources:
  - "Stop the Bleed program (American College of Surgeons)"
  - "FEMA CPG-101 Annex M"
last_reviewed: 2026-04-15
reviewer: <your name or GitHub username>
---

Article body starts here...
```

**Required fields**: `title`, `content_type`, `sources` (at least one), `last_reviewed`  
**Optional fields**: `reviewer`, `tags`, `difficulty` (`beginner` | `intermediate` | `advanced`)

## Writing Standards

### Source requirements

Every factual claim must be traceable to a source in the frontmatter. Acceptable sources:
- FEMA publications (CPGs, guides)
- Red Cross first aid materials
- Military field manuals (FM 21-76, etc.)
- Academic/institutional publications (MIT OCW, etc.)
- ASPCA, National Weather Service, etc.
- CC-licensed community content (cite the original)

Do NOT use Wikipedia as a primary source. It can be a pointer to primary sources.

### Tone

- Plain English for non-technical readers
- Step-by-step numbered lists for procedures
- Warn before sections that require training: `> ⚠️ This procedure requires hands-on training.`
- Avoid jargon; define unavoidable terms inline

### Article length

- Target 300–800 words per article
- Longer procedures → split into multiple articles (e.g., "Bleeding Control — Tourniquets" as a separate article from "Bleeding Control — Direct Pressure")

## Folder `_meta.yaml`

Each content folder needs a `_meta.yaml`:

```yaml
content_type: article_collection
title: Medical Reference
icon: heart-pulse         # lucide-react icon name
sources:
  - "FEMA CPG-101 v2"
  - "Red Cross First Aid 2023"
last_reviewed: 2026-04-01
```

## Initial Library Scope (Sprint 1)

2–4 articles per area, ~30 articles total across 10 areas:

| Area | Seed articles |
|------|--------------|
| `medical/` | bleeding-control, cpr-refresh, medication-stockpiling, pediatric-emergencies |
| `shelter/` | home-hardening, tarp-shelter, safe-room-design |
| `water/` | purification-methods, storage-rotation |
| `fire/` | ignition-fundamentals, stove-safety |
| `food/` | 72-hour-kit, shelf-stable-planning |
| `navigation/` | map-and-compass, mesh-radio-primer |
| `communications/` | pace-model-guide, ham-radio-getting-started |
| `psychology/` | talking-with-children, stress-recovery |
| `opsec/` | challenge-response, doc-protection |
| `legal/` | document-checklist, insurance-basics |

All articles licensed CC-BY-4.0.
