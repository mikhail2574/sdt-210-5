# SDT-210 Project 5: End-to-End Assembly with Persistence

This repo contains a Week 6 "Assemble First" version of the Stadtwerke white-label `Kundenportal` demo. The app includes the public multi-step application flow, customer status area, OCR demo, and a staff backoffice, all wired end-to-end with persistent data.

## Stack

- Frontend: Next.js App Router, React 19, TypeScript, `next-intl`, `react-hook-form`, Zustand
- Persistent backend for Project 5: custom filesystem-backed JSON service inside the Next.js app
- Production-direction foundation kept in repo: `apps/api` NestJS + PostgreSQL prototype

## Project 5

### Backend Choice

Week 6 backend choice: custom filesystem-backed JSON persistence in `src/services/demo-app-service.ts`.

Rationale: it keeps the assembled homework runnable with a single `pnpm dev` command while still providing real persistence across page reloads and route navigation.

### Authentication Approach

- Customer auth: tracking code + password via `/[locale]/login`, persisted with an HTTP-only cookie
- Staff auth: email + password via `/[locale]/backoffice/login`, persisted with an HTTP-only cookie
- Protected pages:
  - `/${locale}/applications/[applicationId]` redirects to login when the customer session does not match the application
  - backoffice pages redirect to login when the staff session is missing
- Logout:
  - backoffice logout is visible in the backoffice shell
  - customer logout is visible on the authenticated customer status page

### Service Architecture

- Client-side backend access goes through [src/services/api.ts](./src/services/api.ts)
- Auth wrappers live in [src/services/auth.ts](./src/services/auth.ts)
- Persistent business logic and storage live in [src/services/demo-app-service.ts](./src/services/demo-app-service.ts)
- Backend configuration is isolated in [src/services/custom-backend-config.ts](./src/services/custom-backend-config.ts) and [src/services/api-config.ts](./src/services/api-config.ts)
- Async UI actions use the thin hook [src/hooks/usePortalApp.ts](./src/hooks/usePortalApp.ts), which exposes `loading` and `error`

### Feature Verification Table

| Feature | Route / UI | Persistence | Status |
| --- | --- | --- | --- |
| Public wizard flow | `/${locale}/forms/[formId]/*` | Filesystem backend + local browser draft state | Done |
| Draft creation and page updates | Wizard next/back actions | Filesystem backend | Done |
| Summary and submit | `/${locale}/forms/[formId]/uebersicht` | Filesystem backend | Done |
| Credential issuance | Final submit result | Filesystem backend | Done |
| Customer login | `/${locale}/login` | Cookie session | Done |
| Protected customer status page | `/${locale}/applications/[applicationId]` | Cookie session + persistent application data | Done |
| Customer logout | Customer status page | Cookie cleared | Done |
| Backoffice login/logout | `/${locale}/backoffice/login` and backoffice shell | Cookie session | Done |
| Protected backoffice routes | `/${locale}/backoffice/*` | Cookie session | Done |
| Dashboard | `/${locale}/backoffice` | Persistent application data | Done |
| Applications list + filters | `/${locale}/backoffice/applications` | Persistent application data | Done |
| Application detail + edit mode | `/${locale}/backoffice/applications/[applicationId]` | Persistent application data + audit log | Done |
| Invitations admin | `/${locale}/backoffice/admin/invitations` | Persistent invitation data | Done |
| Theme editor | `/${locale}/backoffice/admin/theme` | Persistent tenant theme data | Done |
| Form overrides admin | `/${locale}/backoffice/admin/forms` | Persistent form override data | Done |
| Notifications | Backoffice header + dashboard | Derived from persistent unread applications | Done |
| PDF export | Customer + backoffice actions | Built from persistent application data | Done |
| CSV export | Backoffice applications page | Built from persistent application data | Done |
| OCR demo page | `/${locale}/ocr-demo` | Persistent OCR demo records | Done |
| Home page | `/${locale}` | Reachable from nav | Done |
| Settings page | `/${locale}/settings` | Shows backend + browser persistence snapshots | Done |
| About page | `/${locale}/about` | Reachable from nav | Done |

### Running the App

1. Install dependencies:

```bash
pnpm install
```

2. Start the app:

```bash
pnpm dev
```

3. Open `http://localhost:3000/de`

### Useful Commands

```bash
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

- Persistent demo data is stored in `.data/week-06-demo-backend.json`
- Deleting that file resets the Week 6 demo backend to seeded data
- Browser-only draft/session state lives in local storage under `kundenportal-app-state`
