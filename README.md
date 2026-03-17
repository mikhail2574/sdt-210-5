# SDT-210 Project 5: End-to-End Assembly with Persistence

This repo contains a Week 6 "Assemble First" version of the Stadtwerke white-label `Kundenportal`. The public wizard, customer status area, and staff backoffice now use the real backend in `apps/api` instead of an in-process demo store.

## Stack

- Frontend: Next.js App Router, React 19, TypeScript, `next-intl`, `react-hook-form`, Zustand
- Runtime backend: NestJS + TypeORM + PostgreSQL in `apps/api`
- Same-origin web facade: Next.js route handlers proxy browser requests to the backend and keep cookie/session handling inside the web app
- Side feature storage: OCR demo records persist in `.data/ocr-demo-jobs.json`

## Project 5

### Backend Choice

Week 6 backend choice: the real NestJS backend in `apps/api`, backed by PostgreSQL.

Rationale: it satisfies the assignment requirement for normal backend requests, keeps persistence and credentials on the backend, and removes the unreliable in-process demo service from the live app flow.

### Authentication Approach

- Customer auth: tracking code + password via `/[locale]/login`, issued by the backend and persisted with an HTTP-only cookie
- Staff auth: email + password via `/[locale]/backoffice/login`, issued by the backend and persisted with an HTTP-only cookie
- Protected pages:
  - `/${locale}/applications/[applicationId]` redirects to login when the customer session does not match the application
  - backoffice pages redirect to login when the staff session is missing or invalid
- Logout:
  - backoffice logout is visible in the backoffice shell
  - customer logout is visible on the authenticated customer status page

### Service Architecture

- Client-side backend access goes through [src/services/api.ts](./src/services/api.ts)
- Auth wrappers live in [src/services/auth.ts](./src/services/auth.ts)
- Next route handlers under [src/app/api](./src/app/api) are thin proxies to the Nest backend
- Server-side reads go through [src/lib/backend/server-data.ts](./src/lib/backend/server-data.ts)
- Low-level backend request helpers live in [src/lib/backend/api-gateway.ts](./src/lib/backend/api-gateway.ts)
- Async UI actions use the thin hook [src/hooks/usePortalApp.ts](./src/hooks/usePortalApp.ts), which exposes `loading` and `error`
- OCR demo persistence is isolated in [src/services/ocr-demo-service.ts](./src/services/ocr-demo-service.ts)

### Feature Verification Table

| Feature | Route / UI | Persistence | Status |
| --- | --- | --- | --- |
| Public wizard flow | `/${locale}/forms/[formId]/*` | NestJS backend + local browser draft state | Done |
| Draft creation and page updates | Wizard next/back actions | NestJS backend | Done |
| Summary and submit | `/${locale}/forms/[formId]/uebersicht` | NestJS backend | Done |
| Credential issuance | Final submit result | Backend submit response + persisted client credential cache | Done |
| Customer login | `/${locale}/login` | Backend auth + cookie session | Done |
| Protected customer status page | `/${locale}/applications/[applicationId]` | Cookie session + backend application data | Done |
| Customer logout | Customer status page | Cookie cleared | Done |
| Backoffice login/logout | `/${locale}/backoffice/login` and backoffice shell | Backend auth + cookie session | Done |
| Protected backoffice routes | `/${locale}/backoffice/*` | Cookie session + backend `/me` validation | Done |
| Dashboard | `/${locale}/backoffice` | Backend application data | Done |
| Applications list + filters | `/${locale}/backoffice/applications` | Backend application data | Done |
| Application detail + edit mode | `/${locale}/backoffice/applications/[applicationId]` | Backend application data + audit log | Done |
| Invitations admin | `/${locale}/backoffice/admin/invitations` | Backend invitation data | Done |
| Theme editor | `/${locale}/backoffice/admin/theme` | Backend tenant theme data | Done |
| Form overrides admin | `/${locale}/backoffice/admin/forms` | Backend form override data | Done |
| Notifications | Backoffice header + dashboard | Backend unread application feed | Done |
| PDF export | Customer + backoffice actions | Backend-generated PDF stream | Done |
| CSV export | Backoffice applications page | Backend-generated CSV stream | Done |
| OCR demo page | `/${locale}/ocr-demo` | Local OCR demo store | Done |
| Home page | `/${locale}` | Reachable from nav | Done |
| Settings page | `/${locale}/settings` | Shows backend + browser persistence snapshots | Done |
| About page | `/${locale}/about` | Reachable from nav | Done |

### Running the App

1. Install dependencies:

```bash
pnpm install
```

2. Start PostgreSQL and make sure the backend database is reachable with the `API_DB_*` environment variables used in `apps/api/src/database/typeorm.config.ts`.

3. Start the backend:

```bash
pnpm run api:dev
```

4. Start the frontend:

```bash
pnpm dev
```

5. Open `http://localhost:3000/de`

### Useful Commands

```bash
pnpm run api:build
pnpm run test:unit
pnpm exec tsc -p tsconfig.json --noEmit
```

### Demo Credentials

- Customer:
  - Tracking code: `317-000-HA01016`
  - Password: `DemoPass!2026`
- Staff:
  - Email: `staff@stadtwerke.demo`
  - Password: `demo12345`

### Persistence Notes

- Application, invitation, theme, form override, workflow, and auth data live in PostgreSQL through the Nest backend
- OCR demo records are stored in `.data/ocr-demo-jobs.json`
- Browser-only draft/session state lives in local storage under `kundenportal-app-state`
