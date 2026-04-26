# ADR-005 — Four-Zone Repo Structure

**Date**: 2026-04-25  
**Status**: Accepted

## Context

The user's plan repo needs to hold four distinct kinds of content with different ownership, mutability, and update semantics:
1. The user's personal plan (highly sensitive, never overwritten)
2. A curated reference library (maintained by template maintainers, upgradeable)
3. Installed community packs (versioned, upgradeable per-pack)
4. User-created custom content (personal, exportable as packs)

Without explicit separation, an app upgrade could overwrite the user's personal data, and users couldn't safely extend the reference library without losing changes on upgrade.

## Decision

**Four named top-level zones in the repo, each with different write rules:**

| Zone | Path | Owner | GUI editable? | Updated by upgrade? |
|------|------|-------|--------------|---------------------|
| Plan | `plan/` | User | Yes | No |
| Library | `library/` | Template maintainers | "Fork to edit" | Yes |
| Packs | `packs/` | Pack authors | "Fork to edit" | Yes (per-pack) |
| Custom | `custom/` | User | Yes | Never |

**"Fork to edit"**: clicking Edit on `library/` or `packs/` content copies it to `custom/<area>/` first, then opens the editor. The original remains untouched. Users edit the copy.

Zone write enforcement is implemented in `src/lib/persistence/yaml.ts` — writes outside `plan/` and `custom/` throw a `ZoneWriteError`.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Single unstructured folder | Upgrade conflicts; can't distinguish user data from library |
| Git submodules for library | Too complex for non-technical users |
| Separate repos per zone | Too many repos; harder to ZIP-export the whole plan |

## Consequences

- `plan/` is safe from upgrades — families never lose their data
- `library/` can be refreshed from upstream without stomping user edits
- Community packs can be updated without affecting other zones
- Users can safely add `custom/elderly-care/` and it will never be overwritten
- Adding a new zone is a deliberate architectural decision, not a casual move
