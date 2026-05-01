# Family Prepared — Usage Guide

## 1. Creating Your Personal Family Plan

The app is designed so you never touch the code repo for your own plan data. Your plan lives in a separate private GitHub repository (or just in your browser).

### Option A — Use the deployed app

Open [https://jpwill00.github.io/family-prepared](https://jpwill00.github.io/family-prepared) in any browser. Click **Start fresh** or **Connect to GitHub** to begin. Your data lives in your browser's IndexedDB.

### Option B — Run locally

```bash
git checkout main
pnpm dev
# Open http://localhost:5173
```

Plan data is isolated in the browser — it does not touch the code repo.

### Persisting your plan to GitHub

To sync your plan across devices and browsers:

1. Create a new **private** GitHub repo (e.g. `yourname/family-plan`) — this holds your *data*, not the app code.
2. In the app → onboarding → **Connect to GitHub** → complete the Device Flow → enter `yourname/family-plan`.
3. The app pushes your YAML/Markdown plan files to that repo as commits.

Your plan repo and the app repo are completely separate.

---

## 2. Building Your Own Instance

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

## 3. Sharing and Inviting Users

### Share the app

Send people your GitHub Pages URL. It is a public PWA — anyone can use it with their own data, no account required.

### Share a plan (one-time export)

1. **Settings → Export as ZIP** → send the `.zip` file.
2. Recipient opens the app → **Import a backup** → selects the ZIP.

### Family sharing (multi-user, live sync)

1. One person owns a private plan repo (e.g. `smith-family/emergency-plan`).
2. Add family members as collaborators on that repo in GitHub Settings.
3. Each person opens the app → **Connect to GitHub** → enters the shared repo name.
4. Everyone reads and writes to the same repo; last push wins.

---

## 4. Contributing to the Core Repo

### Branch and PR workflow

```bash
# Always branch from main
git checkout main && git pull
git checkout -b feat/your-feature-name

# Make changes, verify
pnpm test --run && pnpm lint && pnpm typecheck

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
| Passphrase-protected ZIP export | Export currently unencrypted |
| Multi-language support | English only |
