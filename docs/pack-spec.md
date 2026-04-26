# Pack Specification

Version: 1.0.0 (MVP)

A **pack** is a versioned ZIP bundle of emergency-preparedness content that can be shared, installed, and removed without affecting the user's personal plan.

## Pack ZIP Structure

```
<pack-id>.zip
└── <pack-id>/
    ├── pack.yaml        ← required: manifest
    ├── LICENSE          ← required: content license
    └── content/
        └── <area-name>/
            ├── _meta.yaml
            └── *.md     ← Markdown articles (or *.yaml for structured data)
```

## `pack.yaml` Manifest Schema

```yaml
id: wilderness-medicine-mit          # kebab-case; unique identifier
version: 1.2.0                       # semver
title: Wilderness Medicine Essentials
author:
  name: Jane Doe
  url: https://github.com/janedoe    # optional
license: CC-BY-4.0                   # SPDX identifier
sources:
  - "MIT OpenCourseWare HST.121, Lecture 7"
description: Field-applicable trauma and evacuation triage for non-clinicians.
content_areas:
  - path: content/trauma-triage
    content_type: article_collection
  - path: content/evac-decision
    content_type: article_collection
requires:
  app_min_version: 0.2.0             # semver; app enforces this on import
checksum: sha256:abc123...           # set by publish tool; verified on import
```

All fields validated with Zod in `src/lib/packs/manifest.ts`.

## Lifecycle

### Import (MVP)

1. User drags or selects a `.zip` file in the Import Pack dialog
2. App unzips and finds `<id>/pack.yaml`
3. `PackManifestSchema.safeParse(rawYaml)` — throws `PackValidationError` on failure
4. Checksum verified against zip contents
5. App version checked against `requires.app_min_version`
6. Pack directory unpacked to `packs/<id>/`
7. Entry added to `packs/_installed.yaml`

### Remove (MVP)

1. User clicks Remove on a pack
2. `packs/<id>/` directory deleted
3. Entry removed from `packs/_installed.yaml`

### Export a custom area as a pack (MVP)

1. User clicks "Export as Pack" on a `custom/<area>/` folder
2. App reads `custom/<area>/_meta.yaml` for title/content_type
3. App generates `pack.yaml` with a UUID id, version `1.0.0`, author empty
4. App computes sha256 checksum of content
5. App produces a `.zip` for download

### Community registry install (Sprint 2)

1. User browses the registry (JSON index hosted in a public GitHub repo)
2. User clicks Install on a pack
3. App fetches the `.zip` from the manifest URL
4. Same validation flow as manual import above

## `_installed.yaml` Lockfile

```yaml
installed:
  - id: wilderness-medicine-mit
    version: 1.2.0
    source: local-import           # or <registry-url>/packs/<id>.zip
    checksum: sha256:abc123...
    installed_at: 2026-04-20T14:30:00Z
```

## Content Authoring

See [content-authoring-guide.md](content-authoring-guide.md) for how to write articles that go into a pack.
