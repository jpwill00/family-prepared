# Family Prepared — Usage Guide

## 1. Creating Your Personal Family Plan

The app stores everything on your device — no account required. Your plan lives in your browser's local storage and works fully offline.

### Option A — Use the deployed app

Open [https://jpwill00.github.io/family-prepared](https://jpwill00.github.io/family-prepared) in any browser. Click **Create plan** to begin. Your data lives in your browser's IndexedDB.

### Option B — Run locally

```bash
git checkout main
pnpm dev
# Open http://localhost:5173
```

Plan data is isolated in the browser — it does not touch the code repo.

### Enabling cloud backup (optional)

To back up your plan and access it across devices:

1. In the app → **Settings → Online backup (optional)** → click **Set up online backup**.
2. Complete the one-time authorization flow (no password needed — uses a temporary code).
3. Enter the name of your private backup repository (e.g. `yourname/family-plan`).
4. The app pulls your plan from that repository.

To save changes back to the cloud, use **Save to cloud now**. To load the latest version, use **Load latest from cloud**.

Your backup repository and the app code repository are completely separate.

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
2. Recipient opens the app → **Restore from a saved file** → selects the ZIP.

### Family sharing (multi-user, live sync)

1. One person owns a private backup repository (e.g. `smith-family/emergency-plan`).
2. Add family members as collaborators on that repository in GitHub Settings.
3. Each person opens the app → **Settings → Online backup (optional)** → **Set up online backup** → enters the shared repository name.
4. Everyone reads and writes to the same repository; last save wins.

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
