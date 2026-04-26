# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, open a [GitHub Security Advisory](https://github.com/family-prepared/family-prepared/security/advisories/new) or email the maintainer directly.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 48 hours. If confirmed, we will:
1. Work on a fix
2. Coordinate disclosure timing with you
3. Credit you in the release notes (if desired)

## Security considerations

This app stores family emergency data locally in IndexedDB. In Sprint 3+, sensitive fields (`secure: true`) will be encrypted using Web Crypto AES-GCM before storage. Until then, treat the app's local storage as unencrypted.

GitHub sync (Sprint 2) uses OAuth Device Flow — no client secret is stored in the browser. Tokens are stored in IndexedDB and will be encrypted in Sprint 3+.
