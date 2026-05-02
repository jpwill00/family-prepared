# GitHub Auth CORS Proxy

A Cloudflare Worker that proxies GitHub's OAuth Device Flow endpoints
and adds `Access-Control-Allow-Origin` headers so the Family Prepared
browser app can call them directly.

## Why this exists

GitHub's `github.com/login/device/code` and `github.com/login/oauth/access_token`
endpoints do not return CORS headers. Direct `fetch()` calls from a browser SPA
are blocked by the browser, producing "failed to fetch". This worker sits between
the app and GitHub, forwarding the request and adding the required CORS header.

## Deploy (one-time setup)

```bash
# Prerequisites: Node 18+ and a Cloudflare account
npm install -g wrangler
wrangler login

cd cloudflare/github-auth-proxy
wrangler deploy
# Note the worker URL printed: https://family-prepared-github-auth.<your-subdomain>.workers.dev
```

## Lock down the allowed origin (recommended)

After deploying, restrict the proxy to your GitHub Pages URL only:

```bash
# Option A — environment variable (keeps wrangler.toml clean)
wrangler secret put ALLOWED_ORIGIN
# Enter: https://jpwill00.github.io

# Option B — hardcode in wrangler.toml (uncomment the [vars] block)
```

## Wire up the app

1. Copy the worker URL from the deploy output
2. Add it to GitHub repo secrets:
   - Go to your `family-prepared` repo → Settings → Secrets and variables → Actions
   - Add secret: `VITE_GITHUB_PROXY_URL` = `https://family-prepared-github-auth.<subdomain>.workers.dev`
3. Trigger a new deploy: `gh workflow run deploy-pages.yml --repo jpwill00/family-prepared`

## Endpoints

| Worker path | Proxied to |
|-------------|-----------|
| `POST /device/code` | `https://github.com/login/device/code` |
| `POST /access_token` | `https://github.com/login/oauth/access_token` |

All other paths return 404. Only POST and OPTIONS are accepted.

## Local development

```bash
wrangler dev
# Worker runs at http://localhost:8787
# Set VITE_GITHUB_PROXY_URL=http://localhost:8787 in .env.local to test locally
```
