/**
 * GitHub OAuth Device Flow CORS Proxy
 *
 * GitHub's device/code and access_token endpoints don't return
 * Access-Control-Allow-Origin headers, so browsers block direct fetch() calls.
 * This worker proxies only those two endpoints and adds the required CORS header.
 *
 * Allowed origins: configure ALLOWED_ORIGIN in wrangler.toml or as a Worker env var.
 * Default: * (open) — restrict to your GitHub Pages URL in production.
 *
 * Deploy:
 *   cd cloudflare/github-auth-proxy
 *   npx wrangler deploy
 *
 * Endpoints proxied:
 *   POST /device/code      → https://github.com/login/device/code
 *   POST /access_token     → https://github.com/login/oauth/access_token
 */

const GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN ?? "*";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    let targetUrl;

    if (url.pathname === "/device/code") {
      targetUrl = GITHUB_DEVICE_CODE_URL;
    } else if (url.pathname === "/access_token") {
      targetUrl = GITHUB_ACCESS_TOKEN_URL;
    } else {
      return new Response("Not found", { status: 404 });
    }

    // Forward the request body and Accept header to GitHub
    const body = await request.text();
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await upstream.text();

    return new Response(data, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(allowedOrigin),
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}
