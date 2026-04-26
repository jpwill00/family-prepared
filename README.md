# Family Prepared

An offline-first PWA for building, versioning, and sharing family emergency-preparedness plans — no terminal required.

## What it does

- Build a complete family emergency plan (household, communication, logistics, inventory) through a friendly GUI
- Plans are stored as human-readable Markdown + YAML, versioned in your GitHub repo
- Works fully offline — your device is the source of truth
- Export a printable PDF for your go-bag
- Share knowledge as community packs (ZIP bundles)

## Get started

1. **[Use this template](https://github.com/family-prepared/family-prepared-template)** — click the green button to copy the template to your own GitHub account
2. Open the app and connect it to your new repo (Settings → Connect to GitHub)
3. Fill out your family plan

Or open the demo at [https://family-prepared.github.io/family-prepared](https://family-prepared.github.io/family-prepared) to try it without a GitHub account (data stays local only).

## For developers / contributors

```bash
# Prerequisites: Node 20+ and pnpm
pnpm install
pnpm dev        # Start dev server at http://localhost:5173
pnpm test       # Run Vitest tests in watch mode
pnpm build      # Production build
pnpm preview    # Preview the production build (tests PWA/SW)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the PR workflow and coding conventions.

## License

MIT — see [LICENSE](LICENSE).  
Reference library content is separately licensed CC-BY-4.0 — see `library/LICENSE.md` in the template repo.
