# Pull Request Workflow

Shared PR workflow for all agents and developers. Reference this file instead of duplicating.

## Creating a PR

```bash
git checkout -b {issue-number}-{description}
# Make changes, commit
git push -u origin {branch-name}
gh pr create --title "[Type] Description" --body "$(cat <<'EOF'
## Summary
- Bullet summary of changes

## Test plan
- [ ] Run `pnpm test --run` and confirm all pass
- [ ] Run `pnpm build` and confirm clean output
- [ ] Manual smoke-test in browser (localhost or Pages preview)

Closes #{issue-number}
EOF
)"
```

That's it. The CI workflow automatically merges the PR once all checks pass — no manual merge step needed.

**What happens after `gh pr create`:**
1. CI runs `Run Tests` + `Lint & Typecheck` + `Pre-Deploy Validation` in parallel
2. If all 3 pass → `Auto-Merge PR` job fires and merges via squash + deletes the branch
3. If any fail → PR stays open for fixes, re-push to retry

> **Note:** The remote branch is deleted automatically by the auto-merge job (`--delete-branch`). Only local cleanup is needed post-merge.

## Verification After PR Creation

1. **Verify** the PR is linked to the issue (check issue page on GitHub)
2. **Confirm** link appears in issue's "Development" section
3. **If link missing**: Edit PR description to add `Closes #{number}`

## PR Requirements

- **One PR per issue** — each GitHub issue gets exactly ONE pull request
- PR must be linked to its GitHub issue
- PR title should follow: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- PR description must include a test plan
- **Do NOT run `gh pr merge --auto` manually** — the CI `auto-merge` job handles this
- Do NOT create a PR without linking to an issue
- Do NOT combine multiple issues into one PR

## Responding to Review Comments

Reply to EACH review comment individually:

```bash
# Get review comment IDs
gh api repos/OWNER/family-prepared/pulls/PR/comments --jq '.[] | {id, path, body}'

# Reply to each comment
gh api repos/OWNER/family-prepared/pulls/PR/comments/COMMENT_ID/replies \
  --method POST -f body="Fixed — [one-line description]"
```

Keep replies SHORT (1 line preferred):
- `Fixed — added Zod validation for pack manifest id field`
- `Fixed — moved IndexedDB write into lib/persistence/idb.ts`
- `Fixed — zone-write guard now prevents direct library/ mutation`

## Post-Merge Cleanup

The remote branch is deleted automatically by the `auto-merge` CI job. Only local cleanup is needed:

```bash
# 1. Delete local branch (remote already deleted by CI)
git branch -d {branch-name}

# 2. Prune stale remote-tracking refs
git fetch --prune
```

## Branch Naming

Format: `{issue-number}-{short-description}`

Examples:
- `12-scaffold-persistence-layer`
- `23-household-member-form`
- `34-pack-import-dialog`
