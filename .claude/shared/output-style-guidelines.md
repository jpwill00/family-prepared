# Output Style Guidelines

Consistent output improves clarity and actionability. Follow these guidelines.

## Code References

**DO**: Use repo-relative paths with line numbers when referencing code:
```
src/lib/persistence/yaml.ts:42 — parseRepo() must handle missing _meta.yaml gracefully
src/lib/packs/import.ts:88 — validate pack.yaml with Zod before unpacking
```

**DON'T**: Use vague references like "in the persistence file" or "somewhere in lib".

## PR and Issue Comments

Use structured markdown:

```markdown
## Summary
- What changed and why

## Files Modified
- `src/lib/persistence/yaml.ts` — added round-trip for nested YAML objects
- `src/lib/schemas/plan.ts` — added HouseholdMember Zod schema

## Verification
- [ ] `pnpm test --run` — all pass
- [ ] Manual: add member in UI → reload → data persists
```

## Code Review Output

Prioritize by severity:

| Label | Meaning |
|-------|---------|
| 🔴 **Critical** | Breaks functionality, must fix before merge |
| 🟡 **Important** | Should fix, degrades quality or correctness |
| 🟢 **Nice to have** | Optional improvement |

Example:
```
🔴 Critical: Direct IndexedDB write in component — all persistence must go through lib/persistence/idb.ts.
🟡 Important: pack.yaml parsed without Zod validation — use lib/packs/manifest.ts schema.
🟢 Nice to have: Extract the article render loop into a shared ArticleList component.
```

## Terminal / Bash Output

- Use absolute paths in commands: `/Users/jpw/Projects/family-prepared/...`
- Chain independent commands with `&&`
- Capture output with `2>&1` when diagnosing failures
- Quote paths with spaces

## Responses to User

- Lead with the concrete outcome, then explain why
- Use short bullet lists over long paragraphs for multi-step changes
- If a change touches 3+ files, show a summary table:

```
| File | Change |
|------|--------|
| src/lib/persistence/yaml.ts | Added nested YAML round-trip |
| src/lib/schemas/plan.ts | Added HouseholdMember schema |
| src/routes/plan/household.tsx | Hooked form to Zustand store |
```
