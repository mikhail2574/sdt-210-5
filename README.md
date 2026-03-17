# Stadtwerke Kundenportal

`1.0.0-beta`

Stadtwerke Kundenportal is a white-label customer portal and staff backoffice for managing utility connection applications. This beta combines a Next.js web application, a NestJS API, PostgreSQL persistence, invitation-based staff onboarding, multilingual UX, and a full end-to-end wizard flow for public applicants.

## Product Scope

The project currently ships three main product areas:

- Public application flow for new and updated utility connection requests
- Customer self-service area for login, application status, timeline, and document access
- Staff backoffice for operations, review, invitations, form configuration, and tenant theming

## Feature Set

### Public Portal

- Multi-step localized application wizard under `/${locale}/forms/[formId]/*`
- Dedicated `Antragsdetails` step plus generic wizard steps for:
  - `anschlussort`
  - `kontaktdaten`
  - `technische-daten`
  - `rechtliche-hinweise`
- Draft persistence to browser state during the wizard
- Server-backed draft and page updates
- Soft-required validation flow with confirmation modal
- Summary page with editable review sections
- Final submission flow with issued credentials

### Customer Area

- Customer login with tracking code and password
- Protected application detail page
- Status overview, timeline, and attachment visibility
- Customer logout
- Final credential handoff after successful submission

### Backoffice

- Staff login and logout
- Invitation-based staff onboarding and invite acceptance
- Protected dashboard with:
  - unread application metrics
  - incomplete and scheduled counts
  - quick links
  - notification feed
- Applications list with filters
- Application detail page with:
  - workflow status
  - timeline
  - page data review
  - audit log
  - staff edit actions
- Invitation administration
- Tenant theme editor
- Form override editor
- PDF export and CSV export

### Supporting Features

- Multilingual routing with `de`, `en`, `tr`, and `es`
- Same-origin API facade via Next.js route handlers
- Session handling with HTTP-only cookies
- OCR demo page with local JSON-backed persistence
- Settings page for backend/browser snapshot inspection
- About and home pages

## Tech Stack

### Frontend

- Next.js 15 App Router
- React 19
- TypeScript
- `next-intl`
- `react-hook-form`
- Zustand
- Zod

### Backend

- NestJS 10
- TypeORM
- PostgreSQL
- Nodemailer for invitation delivery

### Testing and Tooling

- Vitest
- Testing Library
- Playwright
- TypeScript compiler checks
- PNPM workspace tooling

## Architecture

### Web App

- `src/app`
  - App Router pages and route handlers
- `src/app/[locale]`
  - locale-scoped UI routes
- `src/app/api`
  - thin server-side proxy layer between browser and backend
- `src/components/backoffice`
  - backoffice-facing UI
- `src/components/kundenportal`
  - public portal and customer-facing UI
- `src/components/atoms`, `src/components/molecules`
  - shared UI primitives
- `src/hooks/usePortalApp.ts`
  - async UI wrapper around the frontend API
- `src/hooks/useFormDraftPersistence.ts`
  - shared wizard draft hydration and persistence logic

### Server and Data Access

- `src/lib/backend/api-gateway.ts`
  - low-level backend request helpers
- `src/lib/backend/server-data.ts`
  - server-side reads and backoffice context helpers
- `src/lib/frontend/api-client.ts`
  - typed browser-side contract for route-handler calls
- `src/lib/state/app-store.ts`
  - persisted client state for locale, form sessions, backoffice session data, and issued credentials

### Runtime Backend

- `apps/api/src/modules/public-applications`
  - public application workflows
  - staff auth and invitations
  - backoffice application operations
  - effective form resolution and validation
  - PDF creation and email delivery

### Request Flow

1. Browser UI calls typed frontend APIs
2. Next.js route handlers under `src/app/api/*` proxy those requests
3. NestJS handles validation, auth, workflows, and persistence
4. PostgreSQL stores business data
5. HTTP-only cookies keep customer and staff sessions on the server boundary

## Main Routes

### Public

- `/${locale}`
- `/${locale}/forms/[formId]/antragsdetails`
- `/${locale}/forms/[formId]/anschlussort`
- `/${locale}/forms/[formId]/kontaktdaten`
- `/${locale}/forms/[formId]/technische-daten`
- `/${locale}/forms/[formId]/rechtliche-hinweise`
- `/${locale}/forms/[formId]/uebersicht`
- `/${locale}/forms/[formId]/final`

### Customer

- `/${locale}/login`
- `/${locale}/applications/[applicationId]`

### Backoffice

- `/${locale}/backoffice/login`
- `/${locale}/backoffice`
- `/${locale}/backoffice/applications`
- `/${locale}/backoffice/applications/[applicationId]`
- `/${locale}/backoffice/admin/invitations`
- `/${locale}/backoffice/admin/theme`
- `/${locale}/backoffice/admin/forms`
- `/${locale}/invitations/[inviteId]`

### Additional

- `/${locale}/ocr-demo`
- `/${locale}/settings`
- `/${locale}/about`

## Local Development

### Prerequisites

- Node.js 20+ recommended
- PNPM
- PostgreSQL running locally or remotely

### Environment

Create `.env.local` or copy `.env.example`:

```bash
cp .env.example .env.local
```

Core environment variables:

```bash
BACKEND_API_BASE_URL=http://127.0.0.1:3001/api
FRONTEND_APP_URL=http://127.0.0.1:3000

API_DB_HOST=127.0.0.1
API_DB_PORT=5432
API_DB_USER=postgres
API_DB_PASSWORD=postgres
API_DB_NAME=sdt_210_5
```

Invitation email variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_PASSWORD=your-16-char-google-app-password
SMTP_FROM_EMAIL=your-account@gmail.com
SMTP_FROM_NAME=Demo Stadtwerke
INVITATION_LOCALE=de
```

Optional local fallback:

```bash
API_DISABLE_EMAIL_DELIVERY=1
```

### Start the App

Install dependencies:

```bash
pnpm install
```

Start the full stack:

```bash
pnpm dev
```

This starts:

- the NestJS API on port `3001`
- the Next.js web app on port `3000`

Open:

```text
http://localhost:3000/de
```

## Available Scripts

```bash
pnpm dev
pnpm run dev:web
pnpm run build
pnpm run start
pnpm run api:compile
pnpm run api:dev
pnpm run api:build
pnpm run api:migrate:run
pnpm run api:test
pnpm run test:unit
pnpm run test:e2e
pnpm run test
pnpm exec tsc -p tsconfig.json --noEmit
```

## Demo Credentials

### Customer

- Tracking code: `317-000-HA01016`
- Password: `DemoPass!2026`

### Staff

- Email: `staff@stadtwerke.demo`
- Password: `demo12345`

## Persistence Model

- PostgreSQL stores:
  - applications
  - invitations
  - tenant themes
  - form overrides
  - workflow state
  - backoffice/customer auth data
- Local storage key `kundenportal-app-state` stores:
  - preferred locale
  - wizard draft sessions
  - cached session metadata
  - issued credentials
- `.data/ocr-demo-jobs.json` stores OCR demo records

## Quality and Testing

- Unit tests cover store state, frontend API behavior, and wizard behavior
- Playwright covers end-to-end browser flows
- TypeScript is used for static verification across frontend and backend-facing contracts

Recommended checks:

```bash
pnpm exec tsc -p tsconfig.json --noEmit
pnpm run test:unit
pnpm run test:e2e
```

## Beta Notes

`1.0.0-beta` means the platform is feature-complete for the current delivery scope, but still optimized for iteration:

- architecture and component boundaries are actively being refined
- operational flows are implemented end to end
- admin tooling exists for invitations, theme management, and form overrides
- the OCR page remains a side-demo feature with separate local persistence

## License

No license file is included in this repository.
