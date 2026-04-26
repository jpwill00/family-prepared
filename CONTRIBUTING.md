# Contributing to family-prepared

Thank you for helping families stay prepared.

## Prerequisites

- Node.js 20+
- pnpm (`brew install pnpm` on macOS)

## Setup

```bash
git clone https://github.com/family-prepared/family-prepared.git
cd family-prepared
pnpm install
git checkout -b your-feature-branch
pnpm dev
```

## Workflow

1. Pick or open a GitHub issue
2. Branch: `{issue-number}-{short-description}`
3. Make changes — run `pnpm test --run && pnpm lint && pnpm typecheck`
4. Open a PR — CI runs automatically; auto-merge fires when all checks pass
5. No manual merge step needed

## Coding conventions

See [CLAUDE.md](CLAUDE.md) for the full operating manual. Key rules:

- All persistence through `src/lib/persistence/*` — no direct IndexedDB/localStorage
- All YAML schemas need Zod schemas in `src/lib/schemas/` AND round-trip tests
- Service worker registration only in `src/main.tsx`
- `library/` and `packs/` are read-only in the GUI — use "Fork to edit" pattern
- `--no-verify` is prohibited

## Human review gates

- **GATE 1** — Sprint 0 scaffolding reviewed by maintainer before Sprint 1 begins
- **GATE 2** — Sprint 1 MVP reviewed and tested before Sprint 2 begins

## Questions?

Open a GitHub issue or discussion.
