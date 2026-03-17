# React & Next.js Best Practices Review

> Analyzed on: 2026-03-17
> Reference: Vercel Engineering React Best Practices v0.1.0
> Files reviewed: 14 pages, 12 components, 1 hook, 3 service files

---

## Summary

The codebase follows React conventions well: no `&&`-with-falsy JSX, `useDeferredValue` correctly used for draft saves, `useMemo` for expensive computations, and functional `setState` throughout. The one critical gap is a waterfall pattern that appears in every form wizard page — `getResolvedFormRuntime` and the draft/summary fetch run sequentially even though they are fully independent. A secondary issue is that `requireServerStaffUser` and `getResolvedFormRuntime` are not wrapped with `React.cache()`, meaning repeated calls within the same request (possible with RSC streaming or shared layouts) fire duplicate network requests.

---

## Issues

### BP-01: Sequential awaits in all 6 form wizard pages (waterfall)

**Rule**: `async-parallel` (1.4) — Promise.all() for Independent Operations
**Severity**: CRITICAL
**Impact**: Adds a full extra network round-trip on every wizard page load
**Affected files**:
- `src/app/[locale]/forms/[formId]/anschlussort/page.tsx:28-29`
- `src/app/[locale]/forms/[formId]/antragsdetails/page.tsx:27-35`
- `src/app/[locale]/forms/[formId]/kontaktdaten/page.tsx:28-29`
- `src/app/[locale]/forms/[formId]/technische-daten/page.tsx` (same pattern)
- `src/app/[locale]/forms/[formId]/rechtliche-hinweise/page.tsx` (same pattern)
- `src/app/[locale]/forms/[formId]/uebersicht/page.tsx:32-33`

Every form page awaits `getResolvedFormRuntime(formId)` before starting `getDraft(applicationId)` or `getPublicApplicationSummary(applicationId)`. These two operations have zero dependency on each other — `getDraft` only needs `applicationId`, which is available from `searchParams` before `getResolvedFormRuntime` completes.

#### Current (Bad)

```tsx
// anschlussort/page.tsx — also kontaktdaten, antragsdetails, technische-daten, rechtliche-hinweise
const runtime = await getResolvedFormRuntime(formId);     // ← waits for this
const draft = applicationId ? await getDraft(applicationId) : null; // ← then this
```

```tsx
// uebersicht/page.tsx — both fetches are independent
const runtime = await getResolvedFormRuntime(formId);          // ← waits
const summary = await getPublicApplicationSummary(applicationId); // ← then waits
```

#### Recommended (Good)

```tsx
// anschlussort/page.tsx (and all generic wizard pages)
const [runtime, draft] = await Promise.all([
  getResolvedFormRuntime(formId),
  applicationId ? getDraft(applicationId) : Promise.resolve(null)
]);
```

```tsx
// uebersicht/page.tsx
const [runtime, summary] = await Promise.all([
  getResolvedFormRuntime(formId),
  getPublicApplicationSummary(applicationId)
]);
```

**Why this is better**: Both fetches start simultaneously. On a 100ms backend, this cuts the total server time from ~200ms to ~100ms on every wizard page load — a 2× improvement for the most user-facing part of the app.

---

### BP-02: `requireServerStaffUser` and `getResolvedFormRuntime` not wrapped with `React.cache()`

**Rule**: `server-cache-react` (3.4) — Per-Request Deduplication with React.cache()
**Severity**: HIGH
**Affected files**:
- `src/lib/backend/server-data.ts:196-216` (`requireServerStaffUser` / `getServerStaffUser`)
- `src/lib/demo/runtime.ts` (`getResolvedFormRuntime`)

Both functions make network calls on every invocation. `React.cache()` memoizes a function for the lifetime of a single server request — if two RSC nodes in the same render tree call the same cached function with the same arguments, only one network request fires.

In this project, the main risk is the layout/page boundary: Next.js renders `layout.tsx` and `page.tsx` as separate async components in the same RSC stream. If `layout.tsx` ever needs the staff user or the form runtime (e.g., to populate nav state), it would fire a duplicate request. Wrapping these now costs nothing and prevents the issue from ever materializing.

#### Current (Bad)

```ts
// server-data.ts — plain async function, no deduplication
export async function getServerStaffUser() {
  return await requestBackofficeJson<StaffUserProfile>("/me");
}

// Called in every backoffice page — if layout also calls it, /me fires twice
```

#### Recommended (Good)

```ts
import { cache } from "react";

// Deduplicated within the same RSC request automatically
export const getServerStaffUser = cache(async function getServerStaffUser() {
  try {
    return await requestBackofficeJson<StaffUserProfile>("/me");
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
});
```

```ts
// Similarly in runtime.ts:
import { cache } from "react";
export const getResolvedFormRuntime = cache(async function getResolvedFormRuntime(formId: string) {
  // ... existing implementation
});
```

**Why this is better**: Zero behavior change for current usage; makes future refactoring safe. If a layout component or Suspense boundary is ever added that also reads the staff user or form runtime, there is no duplicate fetch.

---

### BP-03: `getMessages` uses a dynamic import without `React.cache()` — loaded on every layout render

**Rule**: `server-cache-react` (3.4) — Per-Request Deduplication
**Severity**: MEDIUM
**Affected file**: `src/lib/i18n.ts:11-14`, called in every backoffice page

`getMessages(locale)` does `await import(\`../../messages/${locale}.json\`)`. Node.js caches ES module imports by resolved path, so the file I/O only happens once per process lifetime. However, the `async function getMessages` itself is not cached — callers that call it on every request go through the dynamic import resolution overhead each time, and any future refactor that makes it do real I/O (e.g., remote translations) would immediately become expensive. Wrapping it with `React.cache()` costs nothing and documents the intent.

#### Current (Bad)

```ts
export async function getMessages(locale: Locale) {
  const messages = await import(`../../messages/${locale}.json`);
  return messages.default;
}
```

#### Recommended (Good)

```ts
import { cache } from "react";

export const getMessages = cache(async function getMessages(locale: Locale) {
  const messages = await import(`../../messages/${locale}.json`);
  return messages.default;
});
```

**Why this is better**: Explicit deduplication guarantee; safe against future changes to how translations are loaded; costs nothing.

---

### BP-04: `navItems` array allocated inside `BackofficeChrome` on every render

**Rule**: `js-cache-property-access` (7.3) / `rendering-hoist-jsx` (6.3)
**Severity**: LOW
**Affected file**: `src/components/backoffice/BackofficeChrome.tsx:28-49`

`navItems` is a plain array of objects built inside the function body on every render. It depends only on `locale`, which rarely changes. This causes fresh object allocations and a new array reference every time `BackofficeChrome` re-renders (e.g., when the `unreadCount` notification count updates). The `key` used in the `.map()` is `item.href`, which is stable, so React diffing is fine — but the objects themselves are unnecessary GC pressure.

#### Current (Bad)

```tsx
export function BackofficeChrome({ locale, ... }: BackofficeChromeProps) {
  // Re-allocated on every render, even when locale hasn't changed
  const navItems = [
    { href: `/${locale}/backoffice`, key: "backoffice.nav.dashboard" },
    { href: `/${locale}/backoffice/applications`, key: "backoffice.nav.applications" },
    // ...3 more
  ];
  // ...
}
```

#### Recommended (Good)

```tsx
export function BackofficeChrome({ locale, ... }: BackofficeChromeProps) {
  const navItems = useMemo(() => [
    { href: `/${locale}/backoffice`, key: "backoffice.nav.dashboard" },
    { href: `/${locale}/backoffice/applications`, key: "backoffice.nav.applications" },
    // ...3 more
  ], [locale]);
  // ...
}
```

**Why this is better**: The array is only rebuilt when `locale` changes (in practice, almost never), not on every `unreadCount` or `notifications` update that causes a re-render.

---

## Summary Table

| Priority | Rule | File(s) | Effort | Impact |
|----------|------|---------|--------|--------|
| 1 | BP-01: Parallelize runtime + draft fetches | All 6 form wizard pages | Low | High — 2× faster wizard pages |
| 2 | BP-02: React.cache() for server data helpers | `server-data.ts`, `runtime.ts` | Low | Medium — prevents future duplicate fetches |
| 3 | BP-03: React.cache() for getMessages | `i18n.ts` | Low | Low — future-proofing |
| 4 | BP-04: useMemo for navItems | `BackofficeChrome.tsx` | Low | Low — minor GC pressure |

---

## What's Already Done Well

- **No `&&` with falsy JSX** — all conditional rendering uses `condition ? <X /> : null` (rule `rendering-conditional-render` — clean)
- **`useDeferredValue` for draft saves** — both wizard forms use `useDeferredValue(values)` to debounce Zustand writes without blocking the input (rule `rerender-transitions` — correct)
- **`useMemo` for expensive computations** — `buildAntragsdetailsSchema`, `visibleFieldIds`, `page`, `softMissingFields` are all memoized (rules `rerender-memo` — correct)
- **Functional `setState` throughout** — all `setValues`, `setErrors`, `setApplicationId` callbacks use the `(prev) => next` form (rule `rerender-functional-setstate` — correct)
- **Lazy state initialization** — `GenericWizardForm` passes `() => getWizardDefaultValues(...)` to `useState` (rule `rerender-lazy-state-init` — correct)
- **`Promise.all()` in backoffice pages** — `DashboardPage`, `ApplicationsListPage`, and `ApplicationDetailPage` all correctly parallelize their two independent fetches (rule `async-parallel` — correct)
- **No barrel-file imports** — all imports reference specific module paths, not re-export index files (rule `bundle-barrel-imports` — clean)
