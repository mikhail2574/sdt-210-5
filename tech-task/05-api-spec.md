# API spec (REST, MVP)

## Executive summary

API строится вокруг:
- multi-tenant isolation,
- form engine runtime (schema + validation),
- application lifecycle (pages, submit, status),
- staff backoffice (list/detail/edit/audit),
- files (S3 presign),
- PDFs,
- emails/notifications (через события/outbox).

## Deliverables
- список endpoint’ов
- auth модель
- error model (коды)
- sample payloads
- events/webhooks (внутренние)

## Общие принципы

- Base URL: /api
- JSON everywhere.
- Correlation-Id: X-Request-Id (генерировать если нет).
- Tenant scope:
  - Public: определяется по formId/applicationId; сервер валидирует принадлежность.
  - Backoffice: определяется по access token (membership tenantId).

## Auth

### Backoffice auth (staff/admin/platform)
- POST /api/auth/login
- Access token (JWT) + Refresh token (httpOnly cookie) — рекомендация
- RBAC claims в access token: userId, tenantIds, roleKey, permissions hash

### Customer auth (Endkunde)
- POST /api/public/auth/login (trackingCode + password)
- Сессия (httpOnly cookie) или JWT (минимум)
- Customer scope привязан к applicationId/tenantId

## Error model

~~~json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human readable",
    "details": [
      { "path": "contact.email", "issue": "invalid_email" }
    ],
    "requestId": "..."
  }
}
~~~

Коды (MVP):
- UNAUTHORIZED
- FORBIDDEN
- NOT_FOUND
- VALIDATION_FAILED
- CONFLICT
- RATE_LIMITED
- INTERNAL

## Public endpoints (Kundenportal)

### Получить effective form schema (base+override)
GET /api/public/forms/{formId}
Response:
~~~json
{
  "formId": "uuid",
  "tenantId": "uuid",
  "theme": { ... },
  "schema": { ...effectiveSchema... },
  "i18nBundle": { ...optional... }
}
~~~

### Создать draft (после 1-го шага)
POST /api/public/forms/{formId}/applications:draft
Body (pageKey + data первого шага):
~~~json
{
  "pageKey": "antragsdetails",
  "data": { ... }
}
~~~
Response:
~~~json
{
  "applicationId": "uuid",
  "trackingHint": "will be issued on submit",
  "status": "DRAFT",
  "nextPageKey": "anschlussort"
}
~~~

### Сохранить страницу (autosave on next/prev)
PUT /api/public/applications/{applicationId}/pages/{pageKey}
Body:
~~~json
{
  "data": { ... },
  "clientRevision": 3
}
~~~
Response:
~~~json
{
  "status": "DRAFT",
  "validation": {
    "hardMissing": [],
    "softMissing": ["contact.phone"]
  },
  "nextPageKey": "..."
}
~~~

### Получить summary/review
GET /api/public/applications/{applicationId}/summary
Response:
~~~json
{
  "applicationId": "...",
  "status": "DRAFT",
  "pages": [
    { "pageKey": "antragsdetails", "data": {...}, "missing": {...} }
  ],
  "missingSummary": {
    "hard": [],
    "soft": [
      { "fieldPath": "installateur.company", "labelKey": "..." }
    ],
    "attachments": [
      { "categoryKey": "lageplan", "missing": true }
    ]
  }
}
~~~

### Submit (выдать креденшлы, зафиксировать consent)
POST /api/public/applications/{applicationId}:submit
Body:
~~~json
{
  "consents": {
    "privacyPolicyAccepted": true,
    "dataProcessingAccepted": true,
    "emailCommunicationAccepted": true,
    "consentVersion": "2026-03-10",
    "language": "de"
  }
}
~~~
Response:
~~~json
{
  "status": "SUBMITTED_INCOMPLETE",
  "trackingCode": "317-000-HA01016",
  "passwordIssued": true,
  "pdf": {
    "applicationPdfReady": false
  }
}
~~~

### Customer login после submit
POST /api/public/auth/login
~~~json
{ "trackingCode": "317-000-HA01016", "password": "..." }
~~~
Response:
~~~json
{ "applicationId": "...", "status": "...", "expiresInSeconds": 1209600 }
~~~

### Customer status/detail
GET /api/public/applications/{applicationId}
Response: summary + status timeline + доступные действия.

### PDF download (customer)
GET /api/public/applications/{applicationId}/pdf?kind=APPLICATION_PDF
Response: presigned download URL или stream.

### Presign upload (attachments)
POST /api/public/applications/{applicationId}/attachments:presign
Body:
~~~json
{
  "categoryKey": "lageplan",
  "fileName": "lageplan.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 123456
}
~~~
Response:
~~~json
{
  "upload": {
    "method": "PUT",
    "url": "https://...",
    "headers": { "Content-Type": "application/pdf" },
    "expiresAt": "..."
  },
  "attachmentId": "uuid"
}
~~~

### OCR demo job
POST /api/public/ocr/jobs
Body:
~~~json
{
  "input": { "attachmentId": "uuid" },
  "expected": "meter_reading_digits"
}
~~~

## Backoffice endpoints

### Staff login
POST /api/auth/login
Body:
~~~json
{ "email": "...", "password": "..." }
~~~
Response:
~~~json
{ "accessToken": "...", "user": { "id": "...", "tenants": [ ... ] } }
~~~

### Get own profile
GET /api/me

### List applications
GET /api/tenants/{tenantId}/applications?status=SUBMITTED_INCOMPLETE&from=...&to=...&sort=-createdAt
Response:
~~~json
{
  "items": [
    {
      "applicationId": "...",
      "trackingCode": "...",
      "formKey": "hausanschluss",
      "status": "SUBMITTED_INCOMPLETE",
      "unreadByStaff": true,
      "createdAt": "...",
      "customerSummary": { "name": "...", "address": "..." }
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 123
}
~~~

### Application detail
GET /api/tenants/{tenantId}/applications/{applicationId}
Response включает:
- все page data
- attachments
- missing summary
- audit markers

### Mark as read
POST /api/tenants/{tenantId}/applications/{applicationId}:markRead

### Staff edit fields (edit mode)
PATCH /api/tenants/{tenantId}/applications/{applicationId}/pages/{pageKey}
Body:
~~~json
{
  "edits": [
    { "fieldPath": "contact.email", "newValue": "x@y.de", "reason": "typo fix" }
  ]
}
~~~
Server:
- валидирует по schema
- пишет audit log (old/new)
- помечает field как staffModified

### Audit log
GET /api/tenants/{tenantId}/applications/{applicationId}/audit

### Status transition
POST /api/tenants/{tenantId}/applications/{applicationId}:transition
~~~json
{ "toStatus": "UNDER_REVIEW", "note": "started review" }
~~~

### Schedule appointment
POST /api/tenants/{tenantId}/applications/{applicationId}/appointment
~~~json
{ "scheduledAt": "2026-03-17T10:00:00+01:00", "notes": "..." }
~~~

### Export CSV
GET /api/tenants/{tenantId}/exports/applications.csv?from=...&to=...

### PDF download (staff)
GET /api/tenants/{tenantId}/applications/{applicationId}/pdf?kind=APPLICATION_PDF

### Invitations
POST /api/tenants/{tenantId}/invitations
GET /api/tenants/{tenantId}/invitations
POST /api/invitations/{inviteId}:accept

### Tenant theme management (admin)
GET /api/tenants/{tenantId}/theme
PUT /api/tenants/{tenantId}/theme

### Form overrides management (admin, MVP-light)
GET /api/tenants/{tenantId}/forms
GET /api/tenants/{tenantId}/forms/{formId}/override
PUT /api/tenants/{tenantId}/forms/{formId}/override

## Events (internal outbox)

События пишутся в event_outbox:
- APPLICATION_SUBMITTED
- APPLICATION_COMPLETED
- APPOINTMENT_SCHEDULED
- PDF_REQUESTED
- EMAIL_REQUESTED
- CLEANUP_DUE

Webhooks наружу (не MVP), но контракт заложить:
- POST /api/tenants/{tenantId}/webhooks (platform admin)
- подписки на event types
