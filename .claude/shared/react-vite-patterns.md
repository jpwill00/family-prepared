# React + Vite Patterns

Conventions for the family-prepared PWA frontend.

## Path Aliases

All imports use `@/` for `src/`:

```ts
// Good
import { usePlanStore } from "@/lib/store/plan";
import { ArticleViewer } from "@/components/library/ArticleViewer";

// Bad — relative paths more than one level deep
import { usePlanStore } from "../../../lib/store/plan";
```

Aliases configured in both `vite.config.ts` and `tsconfig.json` (they must stay in sync).

## Component File Conventions

- One component per file
- File name = component name (`MemberCard.tsx` exports `MemberCard`)
- Co-locate component-specific styles and tests with the component

## Route Structure

Routes live in `src/routes/`. Each file exports a default component that is the page:

```ts
// src/routes/plan/household.tsx
export default function HouseholdRoute() { ... }
```

Use `react-router-dom` data routers with `loader`/`action` for data fetching — not `useEffect` for initial load.

## State Management

- **Zustand** is the only global store (`src/lib/store/plan.ts`)
- Local UI state (modals, form state) lives in component `useState`
- Never store derived data in the store — derive it in selectors

```ts
// Good — selector derives data
const memberCount = usePlanStore((s) => s.plan.household.members.length);

// Bad — storing computed value
const memberCount = usePlanStore((s) => s.memberCount); // memberCount shouldn't be in store
```

## Code Splitting

Lazy-load heavy routes to keep the initial bundle small:

```ts
const LibraryAreaRoute = lazy(() => import("@/routes/library/$area"));
const PdfExport = lazy(() => import("@/lib/persistence/pdf"));
```

Wrap lazy components in `<Suspense>` with a spinner fallback.

## TypeScript Strictness

- Strict mode is on — no implicit `any`
- All Zod schemas in `src/lib/schemas/` must have a corresponding TypeScript type derived from them: `type Plan = z.infer<typeof PlanSchema>`
- Never widen types to avoid errors — fix the schema or the code

## HMR and Dev Server

- `pnpm dev` — local dev with HMR
- The service worker is disabled in dev (`vite-plugin-pwa` mode: `'development'` → no SW registration)
- Test PWA behavior with `pnpm build && pnpm preview`

## Environment Variables

All env vars must be prefixed `VITE_` to be visible in the browser. Never put secrets in `VITE_*` vars — they are public.

```ts
// Good — typed via vite-env.d.ts
const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

// Bad — process.env doesn't exist in Vite browser bundles
const clientId = process.env.GITHUB_CLIENT_ID;
```
