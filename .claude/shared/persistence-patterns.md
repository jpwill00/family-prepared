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

---

## IndexedDB (`lib/persistence/idb.ts`)

- Use `idb-keyval` — simple key/value, no schema migrations needed
- Writes are **debounced** (300ms) to avoid thrashing on rapid form input
- The Zustand store subscribes to state changes and calls `saveRepo` via the debounced write
- `loadRepo` is called once at app startup; result hydrates the Zustand store

### Full public API

```ts
// ── Plan repo ─────────────────────────────────────────────
export async function saveRepo(repo: Repo): Promise<void>
export async function loadRepo(): Promise<Repo | null>
export async function clearRepo(): Promise<void>

// ── Content files (library/*, custom/* markdown) ──────────
export async function saveFiles(files: Map<string, string>): Promise<void>
export async function loadFiles(): Promise<Map<string, string>>
export async function clearFiles(): Promise<void>
export async function mergeFiles(updates: Map<string, string>): Promise<void>
export async function deleteFile(path: string): Promise<void>

// ── GitHub token + sync metadata ──────────────────────────
export interface SyncMeta {
  lastPullSha: string;
  lastSyncedAt: string;
  connectedRepo: string;    // "owner/repo" format
  connectedUser: string;    // GitHub login
}

export async function saveToken(token: string): Promise<void>
export async function loadToken(): Promise<string | null>
export async function clearToken(): Promise<void>
export async function saveSyncMeta(meta: SyncMeta): Promise<void>
export async function loadSyncMeta(): Promise<SyncMeta | null>
export async function clearSyncMeta(): Promise<void>

// ── Crypto: salt + encrypted field blobs ──────────────────
export interface EncryptedField { iv: string; ciphertext: string; }

export async function saveSalt(salt: Uint8Array): Promise<void>
export async function loadSalt(): Promise<Uint8Array | null>
export async function saveEncryptedFields(fields: Record<string, EncryptedField>): Promise<void>
export async function loadEncryptedFields(): Promise<Record<string, EncryptedField> | null>
export async function clearEncryptedFields(): Promise<void>
export async function clearSalt(): Promise<void>
export async function hasEncryptedData(): Promise<boolean>

// ── Passphrase nudge dismiss flag ─────────────────────────
export async function getCryptoPromptDismissed(): Promise<boolean>
export async function setCryptoPromptDismissed(): Promise<void>
```

### IDB key constants (for reference — do not use outside idb.ts)

| Constant | Key | Purpose |
|----------|-----|---------|
| `REPO_KEY` | `"repo"` | Serialized plan YAML files |
| `FILES_KEY` | `"content_files"` | Raw markdown content files |
| `TOKEN_KEY` | `"github_token"` | GitHub OAuth token |
| `SYNC_META_KEY` | `"github_sync_meta"` | Last sync SHA + timestamp |
| `SALT_KEY` | `"crypto_salt"` | PBKDF2 salt stored as `number[]` |
| `ENCRYPTED_FIELDS_KEY` | `"encrypted_fields"` | AES-GCM encrypted sensitive fields |
| `CRYPTO_PROMPT_DISMISSED_KEY` | `"crypto_prompt_dismissed"` | Passphrase nudge one-time dismiss flag |

### Salt storage gotcha

IDB cannot serialize `Uint8Array` directly — store as `number[]`:
```ts
await set(SALT_KEY, Array.from(salt));           // save
const stored = await get<number[]>(SALT_KEY);
return stored ? new Uint8Array(stored) : null;   // load
```

---

## YAML + Markdown (`lib/persistence/yaml.ts`)

Plan files are pure YAML (`.yaml` extension):

```ts
// yaml.ts public API shape
export function parseRepo(files: Map<string, string>): Repo
export function serializeRepo(repo: Repo): Map<string, string>
```

Rules:
- `parseRepo` must be **pure** — no side effects, no IndexedDB calls
- Unknown fields in YAML are preserved (pass-through) — never drop data the app doesn't understand
- All Zod schemas must round-trip: `parseRepo(serializeRepo(repo))` ≡ `repo`
- Missing files in a folder → treat as empty defaults (not an error)

---

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

---

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

---

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

---

## Test Requirements

Every new schema or serializer needs a round-trip test:

```ts
// vitest example
it("round-trips household member", () => {
  const member: HouseholdMember = { name: "Alice", birth_date: "1985-06-01", ... };
  const files = serializeRepo(makeRepo({ household: { members: [member] } }));
  const parsed = parseRepo(files);
  expect(parsed.plan.household.members[0]).toEqual(member);
});
```
