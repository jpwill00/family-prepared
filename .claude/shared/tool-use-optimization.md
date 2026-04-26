# Tool Use Optimization

Guidelines for efficient tool use in Claude Code sessions on this project.

## Always Parallelize Independent Calls

When reading multiple files that don't depend on each other, issue all Read calls in a single message:

```
# Good — parallel reads
Read(src/lib/persistence/yaml.ts)
Read(src/lib/schemas/plan.ts)
Read(src/lib/store/plan.ts)

# Bad — sequential when they're independent
Read(src/lib/persistence/yaml.ts) → wait → Read(src/lib/schemas/...) → wait → ...
```

## Tool Selection

| Task | Use |
|------|-----|
| Find a file by name | `Glob` |
| Search for a pattern in code | `Grep` |
| Read specific file content | `Read` |
| Run tests, git, or shell commands | `Bash` |
| Make targeted code changes | `Edit` (not Write) |
| Create new files | `Write` |
| Multi-step research or codebase exploration | `Agent` |

## Bash Command Patterns

```bash
# Always use absolute paths
pnpm --prefix /Users/jpw/Projects/family-prepared test --run

# Chain dependent commands
git add src/lib/persistence/yaml.ts && git commit -m "fix(persistence): yaml round-trip"

# Capture errors for diagnosis
pnpm typecheck 2>&1 | head -30

# Run independent commands in one Bash call
pnpm lint && pnpm typecheck
```

## Agentic Loop Pattern

For complex tasks, follow: **Explore → Plan → Execute**

1. **Explore**: Read key files, grep for patterns, understand current state
2. **Plan**: Identify exact changes needed, check for side effects
3. **Execute**: Edit/Write files, run tests, verify

Don't execute before exploring — avoid writing code that duplicates existing helpers or contradicts existing patterns.

## Edit vs Write

- **Edit**: Use for all changes to existing files — sends only the diff
- **Write**: Use only for new files or complete rewrites
- Always `Read` a file before `Edit`ing it

## Test After Every Change

After any code change, run the test suite:

```bash
pnpm test --run
```

If tests fail, fix before moving on — don't accumulate failures.

## Grep Patterns for This Project

```bash
# Find direct IndexedDB/localStorage usage outside lib/persistence
grep -r "localStorage\|openDB\|indexedDB" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/lib/persistence"

# Find direct YAML parse/stringify outside lib/persistence
grep -r "js-yaml\|yaml\.load\|yaml\.dump" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/lib/persistence"

# Find service worker registration outside main.tsx
grep -r "serviceWorker\|registerSW" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/main.tsx"

# Find writes to library/ or packs/ paths (zone violation)
grep -r "\"library/\|'library/\|\"packs/\|'packs/" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "readonly\|read\|parse"
```
