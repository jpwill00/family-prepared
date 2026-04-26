# ADR-002 — Local-First Storage

**Date**: 2026-04-25  
**Status**: Accepted

## Context

Emergency preparedness data must be available even when there is no network. The app targets families who may be in a disaster situation where internet connectivity is unavailable. Data must survive browser restarts, device reboots, and offline periods.

## Decision

**IndexedDB (via idb-keyval) is the source of truth. Cloud sync (GitHub) is an enhancement, not a requirement.**

- Plan data is stored in IndexedDB on the user's device
- On startup, the app loads from IndexedDB — no network request needed
- Zustand store is hydrated from IndexedDB on first render
- All writes go through `src/lib/persistence/idb.ts` (debounced 300ms)
- GitHub sync (Sprint 2) pushes/pulls from IndexedDB — it doesn't replace it

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| localStorage | 5MB limit insufficient for photos + library content |
| Cloud-first (Firebase/Supabase) | Requires network; violates offline-first requirement |
| SQLite (OPFS) | More complex; idb-keyval sufficient for MVP data volumes |
| File System Access API | Limited browser support; good option for v2 |

## Consequences

- Data is device-local by default — families must export/back up proactively
- GitHub sync (Sprint 2) provides cloud backup and multi-device access
- ZIP export provides a portable backup format that works everywhere
- Photo storage: base64 in IndexedDB for ≤10 household members at MVP; exported as files in ZIP
