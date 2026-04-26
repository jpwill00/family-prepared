# ADR-001 — Foundational Stack

**Date**: 2026-04-25  
**Status**: Accepted

## Context

We need a client-side stack for an offline-first PWA that:
- Produces static output deployable to GitHub Pages (no Node server)
- Has the lowest contributor barrier (widely known tooling)
- Supports TypeScript with strict mode
- Integrates cleanly with a service worker for offline capability

## Decision

**Vite + React 19 + TypeScript (strict mode) + pnpm**

- **Vite** — fast dev server, native ESM, first-class TS support, `vite-plugin-pwa` for Workbox integration
- **React 19** — stable, dominant ecosystem, widest contributor familiarity
- **TypeScript strict** — catches entire classes of runtime bugs; Zod schemas derive TS types
- **pnpm** — faster than npm, strict node_modules hoisting prevents phantom dependencies

UI layer: **Tailwind CSS v4 + shadcn/ui** (Radix UI primitives + CSS variables for theming).

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| Next.js | Requires Node server for SSR; complicates GitHub Pages static deploy |
| SvelteKit | Smaller ecosystem; higher contributor barrier |
| Vue 3 | Smaller ecosystem than React for emergency use case |
| Astro | Better for content sites; React islands pattern adds complexity for this app |
| Remix | Requires a server (or complex SSG config) |

## Consequences

- Static output only → no server-side rendering; SEO is not a goal for this app
- PWA install + service worker provides "app-like" experience on mobile without App Store
- All data is client-side → IndexedDB as source of truth (see ADR-002)
