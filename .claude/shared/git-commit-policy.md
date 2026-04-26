# Git Commit Policy

Shared git commit policy for all agents and developers.

## Core Rules

1. **`--no-verify` is ABSOLUTELY PROHIBITED** — no exceptions
2. **Never push directly to `main`** — all changes go through a PR
3. **Conventional commit format** — see format below
4. **One logical change per commit** — avoid giant all-in-one commits

## Commit Message Format

```
<type>(<scope>): <short description>

[optional body]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature or component |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `chore` | Deps, config, tooling |
| `style` | Formatting, whitespace |

### Scopes (family-prepared specific)

`plan`, `library`, `packs`, `custom`, `persistence`, `ui`, `pwa`, `github`, `pdf`, `routing`, `config`, `ci`, `docs`

### Examples

```
feat(plan): add household member form with Zod validation
fix(persistence): correct YAML round-trip for nested objects
refactor(packs): extract manifest validation into shared helper
test(persistence): add zip import/export round-trip tests
chore(deps): add vite-plugin-pwa and workbox-window
docs(adrs): add ADR-005 four-zone repo structure
```

## When Pre-commit Hooks Fail

If hooks fail on commit:

1. **Read the error** — it tells you exactly what's wrong
2. **Fix the code** — update to pass the check
3. **Re-stage** — `git add` the fixed files
4. **Commit again** — never use `--no-verify`

## Prohibited Commands

```bash
git commit --no-verify      # ❌ NEVER
git commit -n               # ❌ NEVER
git push --force origin main # ❌ NEVER
```

## Staging Files

Prefer staging specific files rather than `git add -A` or `git add .`:

```bash
git add src/lib/persistence/yaml.ts src/lib/schemas/plan.ts
```

This prevents accidentally staging `.env`, `dist/`, `playwright-report/`, or generated assets.

## References

- PR workflow: `.claude/shared/pr-workflow.md`
- Project conventions: `CLAUDE.md`
