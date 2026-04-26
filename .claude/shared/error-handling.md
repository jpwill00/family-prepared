# Error Handling

Client-side error handling protocols for the family-prepared PWA.

## React Error Boundaries

Wrap all route-level components with an ErrorBoundary. Never let an unhandled error crash the entire app:

```tsx
// Good — route wrapped in boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <HouseholdRoute />
</ErrorBoundary>

// Bad — no boundary; one render error kills the whole app
<HouseholdRoute />
```

Use a shared `ErrorFallback` component that shows a friendly message and a "Reload" button.

## Persistence Error Handling

All `lib/persistence/*` functions are async and can fail (IndexedDB quota, corrupt YAML, malformed ZIP):

```ts
// Good — catch and surface; never silently swallow
try {
  await saveRepo(repo);
} catch (err) {
  toast.error("Could not save — check storage quota");
  console.error("[persistence] saveRepo failed:", err);
}

// Bad — silently swallows
saveRepo(repo).catch(() => {});
```

## Pack Import Validation

Always validate before unpacking:

```ts
// Good — Zod parse before side effects
const result = PackManifestSchema.safeParse(rawYaml);
if (!result.success) {
  throw new PackValidationError(result.error.format());
}
// only now proceed with unpack
```

## Offline / Network Error Handling

The app must remain functional offline. Never show a broken state because a fetch failed:

```ts
// Good — graceful degradation
try {
  await syncToGitHub(repo);
} catch (err) {
  setGitHubSyncStatus("offline");
  // local data is still the source of truth — no error state in UI
}
```

## Conflict Resolution

When receiving conflicting guidance:
1. Attempt to resolve based on `CLAUDE.md` critical rules (zone ownership, persistence module boundary)
2. If unable to resolve: escalate with full context
3. Document the conflict in a GitHub issue comment

## Error Reporting Format

```markdown
## Error Report

**Component**: [persistence|packs|content-registry|github-sync|pdf-export]
**Route/Action**: [import-pack|export-zip|save-household|render-article]
**Error Type**: [quota-exceeded|yaml-parse|zip-corrupt|zod-validation|network]

### What Happened
[Brief description]

### What Was Tried
1. [First approach]
2. [Fallback]

### What's Needed
[Specific resolution required]
```

## Retry Strategy

- **Max attempts**: 3 retries for transient failures (GitHub sync, PDF render)
- **Backoff**: Exponential — 500ms, 1s, 2s
- **Scope**: Apply to GitHub API calls only — never retry local persistence errors

## Failure Modes

### Pack Import Failure
ZIP is malformed or `pack.yaml` fails Zod validation.
- **Action**: Show `ImportDialog` error state with the specific validation message; don't modify `_installed.yaml`

### PDF Export Failure
`@react-pdf/renderer` throws during document generation.
- **Action**: Toast error + offer "Export ZIP instead" fallback

### YAML Parse Failure
Repo files are corrupt or hand-edited into an invalid state.
- **Action**: Surface the parse error with the offending file path; offer "Reset to empty" option per-zone
