# Persistence Patterns

Rules for IndexedDB, YAML, ZIP, and PDF operations.

## Module Boundary — CRITICAL

**All persistence operations must go through `src/lib/persistence/*`.**

```ts
// Good — through the persistence module
import { saveRepo, loadRepo } from "@/lib/persistence/idb";
import { parseRepo, serializeRepo } from "@/lib/persistence/yaml";

// Bad — direct IndexedDB or YAML calls in components or store
import { get, set } from "idb-keyval"; // only lib/persistence/idb.ts may import this
import yaml from "js-yaml";            // only lib/persistence/yaml.ts may import this
```

This boundary exists so zone-write enforcement and serialization logic stay in one place.

## IndexedDB (`lib/persistence/idb.ts`)

- Use `idb-keyval` — simple key/value, no schema migrations needed
- Writes are **debounced** (300ms) to avoid thrashing on rapid form input
- The Zustand store subscribes to state changes and calls `saveRepo` via the debounced write
- `loadRepo` is called once at app startup; result hydrates the Zustand store

```ts
// idb.ts public API shape
export async function saveRepo(repo: Repo): Promise<void>
export async function loadRepo(): Promise<Repo | null>
export async function clearRepo(): Promise<void>
```

## YAML + Markdown (`lib/persistence/yaml.ts`)

Plan files are Markdown with YAML frontmatter, or pure YAML (`.yaml` extension):

```ts
// yaml.ts public API shape
export function parseRepo(files: Map<string, string>): Repo
export function serializeRepo(repo: Repo): Map<string, string>
```

Rules:
- `parseRepo` must be **pure** — no side effects, no IndexedDB calls
- Unknown fields in YAML are preserved (pass-through) — never drop data that the app doesn't understand
- All Zod schemas must round-trip: `parseRepo(serializeRepo(repo))` ≡ `repo`
- Missing `_meta.yaml` files in a folder → treat as `content_type: article_collection` (fallback)

## ZIP Import/Export (`lib/persistence/zip.ts`)

```ts
// zip.ts public API shape
export async function exportRepoAsZip(repo: Repo): Promise<Blob>
export async function importRepoFromZip(file: File): Promise<Repo>
```

Rules:
- `importRepoFromZip` validates `plan.yaml` with Zod before returning — throws `RepoValidationError` on failure
- `exportRepoAsZip` must include ALL four zones, even if empty
- ZIP entry paths use forward slashes on all platforms

## PDF Export (`lib/persistence/pdf.tsx`)

Uses `@react-pdf/renderer`. Heavy — always lazy-loaded:

```ts
const { exportPdf } = await import("@/lib/persistence/pdf");
```

PDF covers:
1. `plan/*` sections (household, communication, logistics, inventory)
2. Optionally selected `library/*` areas
3. Optionally selected `custom/*` areas

The PDF includes a "Printed at" timestamp and a note: "Keep a physical copy in your go-bag."

## Zone Write Enforcement

Writes to `library/` and `packs/` paths are **blocked** in `lib/persistence/yaml.ts`:

```ts
// zone enforcement pseudocode
function assertWritable(path: string): void {
  if (path.startsWith("library/") || path.startsWith("packs/")) {
    throw new ZoneWriteError(
      `Cannot write to ${path}. Use "Fork to edit" to copy to custom/ first.`
    );
  }
}
```

The "Fork to edit" action copies the content to `custom/<area>/` and then opens the editor.

## Test Requirements

Every new schema or serializer needs a round-trip test:

```ts
// vitest example
it("round-trips household member", () => {
  const member: HouseholdMember = { name: "Alice", birthDate: "1985-06-01", ... };
  const files = serializeRepo(makeRepo({ household: { members: [member] } }));
  const parsed = parseRepo(files);
  expect(parsed.plan.household.members[0]).toEqual(member);
});
```
