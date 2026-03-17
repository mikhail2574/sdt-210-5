# CLAUDE.md

## Project Summary

This repo is a Week 6 "Assemble First" delivery for a Stadtwerke white-label `Kundenportal`. It must prioritize full reachability, persistence, backend correctness, and explainable architecture over polished UI.

## Architecture Rules

1. Keep the current Next.js App Router architecture.
2. Do not rewrite the app to React Router just to mirror the assignment wording.
3. Client-side backend calls must go through `src/services/api.ts`.
4. Authentication helpers must go through `src/services/auth.ts`.
5. The real source of truth is the Nest backend in `apps/api`; do not add new in-process demo persistence for application, auth, backoffice, theme, invitation, or form-override flows.
6. Next route handlers under `src/app/api` should stay thin and proxy to the backend while handling same-origin cookies for the web app.
7. UI components should stay thin and call the async hook `src/hooks/usePortalApp.ts` for backend mutations.
8. Prefer building new shared frontend controls from `src/components/atoms` and `src/components/molecules` before duplicating raw form markup.
9. Keep high-level components at a single level of abstraction:
   - pages assemble sections and fetch data
   - components render UI and call hook operations
   - backend helpers own transport and request shaping

## Backend Choice

- Week 6 runtime backend: `apps/api` NestJS + TypeORM + PostgreSQL
- Backend gateway helpers: `src/lib/backend/api-gateway.ts`
- Server-side read helpers: `src/lib/backend/server-data.ts`
- Browser base-path config: `src/services/api-config.ts`
- Reason: use normal backend requests and keep credentials and persistence on the backend instead of a fake local store

## Auth Rules

- Customer auth uses tracking code + password and an HTTP-only cookie storing the issued application session.
- Staff auth uses email + password and an HTTP-only cookie storing the backend bearer token.
- Protected customer page: `/${locale}/applications/[applicationId]`
- Protected staff area: all `/${locale}/backoffice/*` pages
- Keep logout visible on authenticated pages.
- Server-side staff checks must validate the cookie against the backend `/me` endpoint, not by decoding or mocking local profile data.

## File Organization

- `src/services/api.ts`: browser-facing API service
- `src/services/auth.ts`: auth-specific service wrappers
- `src/lib/backend/api-gateway.ts`: low-level backend request/proxy helpers
- `src/lib/backend/server-data.ts`: server-side data fetching helpers
- `src/services/ocr-demo-service.ts`: local OCR demo persistence only
- `src/hooks/usePortalApp.ts`: thin async hook with `loading` and `error`
- `src/components/atoms/*`: reusable primitive controls
- `src/components/molecules/*`: small composite UI building blocks
- `src/app/[locale]/...`: page routes
- `src/components/...`: UI only
- `apps/api/src/modules/public-applications/...`: backend business logic
- `apps/api/src/modules/public-applications/services/email-config.ts`: SMTP and invitation mail config
- `apps/api/src/modules/public-applications/services/email.service.ts`: outbound invitation email delivery

## Conventions

- Prefer the simplest possible HTML structure when adding new Week 6 pages.
- When adding a new backend-backed feature:
  1. add or extend the backend contract in `apps/api`
  2. expose it through Next route proxies in `src/app/api` if the browser needs same-origin access
  3. surface browser mutations through `src/services/api.ts` and `src/hooks/usePortalApp.ts`
  4. render it with minimal UI and visible loading/error states
- Keep data inspectable. JSON dumps are acceptable and preferred for homework-aligned features.
- Preserve seeded demo credentials unless the user explicitly asks to change them.
- Do not reintroduce fallback reads or writes to deleted demo services just to make the UI work offline.

## Verification Expectations

Before finishing a task, prefer running:

```bash
pnpm exec tsc -p tsconfig.json --noEmit
pnpm run test:unit
```

If a change affects backend integration behavior, confirm that the Next proxy route, the server-rendered page, and the client mutation path all still agree on the same backend contract.
