# MVP Scope

What's in and out of the Sprint 1 MVP.

## In Scope (Sprint 1)

### Core modules
- **Household Identity** — add/edit/delete family members (name, birth date, dietary, medical, photo)
- **Communication Plan** — PACE tier editor (4 tiers), contacts per tier, out-of-town contact
- **Logistics** — safe rooms, meeting points (primary + alternate), evacuation routes (GeoJSON paste)
- **Resource Inventory** — go-bag checklist (resettable), medications list, home supplies, auto-suggested water target

### Persistence
- IndexedDB as source of truth (idb-keyval)
- YAML round-trip: `parseRepo` / `serializeRepo`
- ZIP whole-repo import + export
- PDF export (plan + selected library/custom areas)

### Library
- Read-only viewer for `library/` content
- Article rendering with Markdown + frontmatter citations
- "Fork to edit" → copies article to `custom/` first

### Packs
- Import a `.zip` pack (validate manifest, unpack to `packs/<id>/`)
- Remove an installed pack
- Export a `custom/<area>/` as a pack `.zip`

### Custom content
- "New Content Area" dialog (name, content_type, icon)
- Markdown editor (textarea + preview) for `article_collection` areas

### Infrastructure
- Offline-first service worker (Workbox)
- PWA installable (manifest, icons)
- GitHub Pages deployment

## Out of Scope (Sprint 2+)

| Feature | Reason deferred |
|---------|----------------|
| GitHub OAuth + read/commit sync | Need OAuth app registered; MVP proves value first |
| Community pack registry browser | Need ≥3 community packs to exist first |
| Pack update with diff/accept | Need a pack v2 to test against |
| Encryption of `secure: true` fields | Web Crypto API implementation; not blocking MVP |
| GeoJSON drawing UI (leaflet-draw) | Paste/import flow sufficient for MVP |
| PACE auto-routing | Needs contact data to route; beyond MVP |
| AI plan generation | Instrument first to understand what users struggle with |
| Native packaging (Capacitor) | App Store presence not needed at MVP |

See [docs/post-mvp-backlog.md](post-mvp-backlog.md) for the prioritized backlog.
