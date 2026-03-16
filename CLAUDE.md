# CLAUDE.md

## Project Summary

This repo is a Week 6 "Assemble First" delivery for a Stadtwerke white-label `Kundenportal`. It must prioritize full reachability, persistence, and explainable architecture over polished UI.

## Architecture Rules

1. Keep the current Next.js App Router architecture.
2. Do not rewrite the app to React Router just to mirror the assignment wording.
3. Client-side backend calls must go through `src/services/api.ts`.
4. Authentication helpers must go through `src/services/auth.ts`.
5. Persistent business logic and storage belong in `src/services/demo-app-service.ts`.
6. UI components should stay thin and call the async hook `src/hooks/usePortalApp.ts` for backend mutations.
7. Keep high-level components at a single level of abstraction:
   - pages assemble sections
   - components render UI and call hook operations
   - services own persistence and business logic

## Backend Choice

- Week 6 runtime backend: custom filesystem-backed JSON store
- Config file: `src/services/custom-backend-config.ts`
- Data file: `.data/week-06-demo-backend.json`
- Reason: single-command local startup with real persistence across reloads

The repo also contains `apps/api` as a production-direction NestJS/Postgres foundation. Do not delete it, but prefer the custom backend for the Week 6 assembled demo unless the task explicitly says to move the running app over to Nest.

## Auth Rules

- Customer auth uses tracking code + password and an HTTP-only cookie.
- Staff auth uses email + password and an HTTP-only cookie.
- Protected customer page: `/${locale}/applications/[applicationId]`
- Protected staff area: all `/${locale}/backoffice/*` pages
- Keep logout visible on authenticated pages.

## File Organization

- `src/services/api.ts`: browser-facing API service
- `src/services/auth.ts`: auth-specific service wrappers
- `src/services/*-config.ts`: configuration files only
- `src/services/demo-app-service.ts`: persistent domain logic
- `src/hooks/usePortalApp.ts`: thin async hook with `loading` and `error`
- `src/app/[locale]/...`: page routes
- `src/components/...`: UI only

## Conventions

- Prefer the simplest possible HTML structure when adding new Week 6 pages.
- When adding a new persistent feature:
  1. add or extend a service function in `src/services/demo-app-service.ts`
  2. expose it through `src/services/api.ts` if it is called from the browser
  3. wire it through `src/hooks/usePortalApp.ts`
  4. render it with minimal UI and visible loading/error states
- Keep data inspectable. JSON dumps are acceptable and preferred for homework-aligned features.
- Preserve seeded demo credentials unless the user explicitly asks to change them.

## Verification Expectations

Before finishing a task, prefer running:

```bash
pnpm exec tsc -p tsconfig.json --noEmit
pnpm run test:unit
```

If a change affects persistent storage behavior, confirm that the data still survives a page reload and that the seeded demo routes remain reachable.
