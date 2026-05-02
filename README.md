# Family Prepared

An offline-first PWA for building, versioning, and sharing family emergency-preparedness plans — no terminal required.

## What it does

- Build a complete family emergency plan (household, communication, logistics, inventory) through a friendly GUI
- **No account required** — everything stays on your device; works fully offline
- Share your plan as a ZIP file, PDF, or optional cloud backup
- Sensitive fields (medical info, contacts, medications) encrypted at rest with AES-GCM
- Optional cloud backup via GitHub (Device Flow — no backend, repo created automatically)
- Export a printable PDF for your go-bag
- Browse and import community knowledge packs

## Quick start

**Try it now** — open [https://jpwill00.github.io/family-prepared](https://jpwill00.github.io/family-prepared) in any browser. No account required; your plan lives on your device.

1. Click **Create plan** and name your plan
2. Fill in your household, communication, logistics, and inventory sections
3. Export a ZIP or PDF to share with family, or enable cloud backup in Settings

**To enable cloud backup across devices (optional):**
- In the app → **Settings** → **Online backup (optional)** → **Set up online backup**
- The app creates a private repository for you automatically — no manual setup needed

See [instructions/usage-guide.md](instructions/usage-guide.md) for the full guide, and [instructions/sharing-with-family.md](instructions/sharing-with-family.md) for sharing options.

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
