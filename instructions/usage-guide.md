# Family Prepared — Usage Guide

## 1. Creating Your Personal Family Plan

The app stores everything on your device — no account required. Your plan lives in your browser's IndexedDB and works fully offline.

### Option A — Use the deployed app

Open [https://jpwill00.github.io/family-prepared](https://jpwill00.github.io/family-prepared) in any browser. Click **Create plan** to begin.

### Option B — Run locally

```bash
git clone https://github.com/jpwill00/family-prepared
cd family-prepared
pnpm install
pnpm dev
# Open http://localhost:5173
```

Plan data is isolated in the browser — it does not touch the code repo.

### Protecting sensitive fields (optional)

Medical notes and other sensitive fields can be encrypted on your device with a passphrase.

1. In the app → **Settings → Passphrase encryption** → **Set passphrase**
2. You'll be prompted once when you first enter a sensitive field if no passphrase is set yet.

---

## 2. Enabling Cloud Backup (Optional)

To back up your plan and access it across devices:

1. In the app → **Settings → Online backup (optional)** → click **Set up online backup**
2. Complete the one-time authorization flow (no password needed — uses a temporary code shown on screen)
3. The app suggests a backup repository name (e.g. `family-prepared-yourname`) and creates a **private** repository on your GitHub account automatically
4. Your current plan is pushed to the new repository immediately

To save changes back to the cloud: **Save to cloud now**. To load the latest version: **Load latest from cloud**.

> Your backup repository and the app code repository are completely separate. The backup repo contains only your plan data.

### Already have a backup repository?

If you previously created a backup or want to connect to a shared family repo, click **I already have a backup repository** after the authorization step and enter the repository name (e.g. `yourname/family-prepared-yourname`).

---

## 3. Sharing Your Plan with Family

See [sharing-with-family.md](sharing-with-family.md) for step-by-step instructions covering:

- **ZIP file** — easiest; no accounts needed; works offline
- **Shared GitHub repository** — live sync across multiple family members
- **PDF export** — for printing and physical go-bags

---

## 4. Building Your Own Instance

For someone who wants their own hosted copy of the app:

```bash
# 1. Create your own copy from the template
gh repo create my-family-prepared --template jpwill00/family-prepared --private

# 2. Clone and configure
git clone https://github.com/you/my-family-prepared
cd my-family-prepared
cp .env.example .env.local
```

### Required environment variables

| Variable | How to get it |
|---|---|
| `VITE_GITHUB_CLIENT_ID` | Create a GitHub OAuth App at github.com/settings/developers. Set the callback URL to your GitHub Pages URL. |
| `VITE_TEMPLATE_REPO` | `jpwill00/family-prepared-template` (or your own fork) |

```bash
# 3. Install, build, and deploy
pnpm install && pnpm build
```

Enable Pages in your repo: **Settings → Pages → Source: GitHub Actions**. Push to `main` — the `deploy-pages.yml` workflow fires automatically.

---

## 5. Contributing to the Core Repo

### Branch and PR workflow

```bash
# Always branch from main
git checkout main && git pull origin main
git checkout -b feat/your-feature-name

# Make changes, verify
pnpm test --run && pnpm lint && pnpm typecheck && pnpm build

# Open a PR — CI auto-merges when all checks pass
gh pr create --base main
```

Never push directly to `main`. The CI gate (`test`, `lint`, `pre-deploy`) auto-merges passing PRs via squash.

### Architecture decisions

Write an ADR in `docs/adrs/` for anything that changes the architecture: new content type, new storage pattern, new third-party dependency. See existing ADRs for the format.

### What is not yet built

| Feature | Notes |
|---|---|
| Community pack registry | `VITE_REGISTRY_URL` wired but no registry exists yet |
| Conflict resolution UI | Push/pull is currently last-write-wins |
| Playwright E2E tests | Framework installed; no tests written |
| Passphrase-protected ZIP export | ZIP export is currently unencrypted |
| Multi-language support | English only |
