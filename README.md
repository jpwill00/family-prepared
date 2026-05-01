# Family Prepared

An offline-first PWA for building, versioning, and sharing family emergency-preparedness plans — no terminal required.

## What it does

- Build a complete family emergency plan (household, communication, logistics, inventory) through a friendly GUI
- Plans are stored as human-readable Markdown + YAML, versioned in your own private GitHub repo
- Works fully offline — your device is the source of truth
- Sync across devices via GitHub OAuth (Device Flow — no backend required)
- Sensitive fields (medical info, contacts, medications) encrypted at rest with AES-GCM
- Export a printable PDF for your go-bag or a ZIP backup to share
- Browse and import community knowledge packs

## Quick start

**Try it now** — open [https://jpwill00.github.io/family-prepared](https://jpwill00.github.io/family-prepared) in any browser. No account required; data stays local.

**To persist your plan across devices:**
1. Create a new private GitHub repo (e.g. `yourname/family-plan`) — this holds your *data*, not the app code
2. In the app → **Connect to GitHub** → complete the Device Flow authorization → enter your repo name
3. The app syncs your plan to that repo as plain Markdown + YAML commits

See [instructions/usage-guide.md](instructions/usage-guide.md) for the full guide covering personal plans, hosting your own instance, family sharing, and contributing.

## For developers

```bash
# Prerequisites: Node 20+ and pnpm
pnpm install
pnpm dev        # Start dev server at http://localhost:5173
pnpm test       # Run Vitest tests in watch mode
pnpm test --run # Run tests once (CI mode)
pnpm build      # Production build
pnpm preview    # Preview the production build (tests PWA/SW)
pnpm lint       # ESLint check
pnpm typecheck  # TypeScript check
```

Copy `.env.example` to `.env.local` and fill in `VITE_GITHUB_CLIENT_ID` and `VITE_TEMPLATE_REPO` before running the GitHub sync features.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the PR workflow and coding conventions.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Vite + React + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Storage | IndexedDB via idb-keyval |
| Encryption | Web Crypto API — AES-GCM, PBKDF2 |
| GitHub sync | Octokit REST (Device Flow, no backend) |
| Maps | react-leaflet |
| PDF export | @react-pdf/renderer |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest + React Testing Library |

## License

MIT — see [LICENSE](LICENSE).
Reference library content is separately licensed CC-BY-4.0 — see the [template repo](https://github.com/jpwill00/family-prepared-template).
