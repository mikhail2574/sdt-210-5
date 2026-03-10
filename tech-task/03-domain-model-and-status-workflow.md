# Domain model + Status workflow (MVP)

> NOTE: диаграммы и code blocks внутри этого файла обозначены через ~~~, чтобы избежать конфликтов с форматированием в чате.

## Executive summary

Этот документ фиксирует:
- сущности и связи (ER),
- контрактные поля (минимум для MVP),
- статусную машину заявки и разрешенные переходы,
- правила «кто может менять статус»,
- точки аудита и retention.

## Deliverables
- ER-диаграмма (mermaid)
- Таблица сущностей и ключевых полей
- State machine (mermaid) + transition rules
- RBAC mapping на статусы
- Правила блокировок редактирования Endkunde

## Сущности (MVP)

### Tenant
- id (uuid)
- code (P001/P002…)
- name
- themeJson (jsonb)
- isActive
- createdAt

### User (staff/installateur/platform)
- id (uuid)
- email (unique global)
- passwordHash
- isPlatformAdmin (bool)
- createdAt, lastLoginAt

### TenantUser (membership)
- tenantId + userId (unique)
- roleKey (e.g. TENANT_ADMIN, STAFF, INSTALLATEUR)
- permissionsJson (override) — MVP: optional

### Invitation
- id, tenantId
- email
- roleKey
- tokenHash, expiresAt
- status (PENDING/ACCEPTED/EXPIRED/REVOKED)
- createdAt, acceptedAt

### FormDefinition
(«что доступно»)
- id (uuid)
- tenantId (nullable: NULL = global base template)
- key (hausanschluss/leistungserhoehung/stilllegung/bankdaten)
- titleI18nKey
- schemaJson (jsonb) — базовый template (form/page/section/field)
- isPublished
- version (int)
- createdAt

### FormOverride
(«как кастомизируем»)
- id, tenantId
- baseFormId
- operationsJson (jsonb) — список операций patch
- createdAt

### Application (Antrag)
- id (uuid) — internal id
- tenantId
- formId (effective)
- publicTrackingCode (string, unique per tenant)
- customerAccessPasswordHash (или temp password hash)
- status (см. ниже)
- currentStepKey (string)
- isLockedForCustomer (bool derived)
- unreadByStaff (bool)
- createdAt, submittedAt, lastActivityAt, completedAt

### ApplicationPageData
- id, applicationId
- pageKey
- dataJson (jsonb)
- softMissingJson (jsonb) — список missing soft_required + причины
- hardMissingJson (jsonb) — required missing (для диагностики; обычно 0 после сохранения страницы)
- updatedAt
- updatedByActorType (CUSTOMER/STAFF/SYSTEM)
- updatedByUserId (nullable)

### ApplicationAuditLog (field-level)
- id, applicationId
- changedAt
- changedByUserId
- changedByActorType (STAFF/ADMIN/PLATFORM_ADMIN)
- pageKey
- fieldPath (e.g. "contact.email")
- oldValueJson
- newValueJson
- reason (optional text)

### Attachment
- id, tenantId, applicationId
- categoryKey (lageplan/grundrisse/flurkarte/sonstiges/…)
- fileName, mimeType, sizeBytes
- storageKey (S3 key)
- status (UPLOADED/VERIFIED/DELETED)
- uploadedAt

### Appointment
- id, applicationId
- scheduledAt (timestamp)
- timezone ("Europe/Berlin")
- scheduledByUserId
- notes
- createdAt

### Notification
- id, tenantId
- userId (recipient)
- type (NEW_APPLICATION / APPLICATION_UPDATED / APPOINTMENT_SET / …)
- payloadJson
- isRead
- createdAt, readAt

### EmailOutbox
- id, tenantId
- toEmail
- templateKey
- language
- payloadJson
- status (PENDING/SENT/FAILED)
- attempts
- lastError
- createdAt, sentAt

### PdfArtifact
- id, tenantId, applicationId
- kind (APPLICATION_PDF / SEPA_PDF)
- version
- storageKey
- createdAt

### OcrJob (demo)
- id, tenantId, applicationId (nullable)
- inputStorageKey
- status (PENDING/RUNNING/SUCCEEDED/FAILED)
- resultJson (detected values)
- createdAt, finishedAt

## ER-диаграмма (Mermaid)

~~~mermaid
erDiagram
  TENANT ||--o{ TENANT_USER : has
  USER ||--o{ TENANT_USER : member
  TENANT ||--o{ INVITATION : invites
  TENANT ||--o{ FORM_DEFINITION : owns
  FORM_DEFINITION ||--o{ FORM_OVERRIDE : customized_by
  TENANT ||--o{ APPLICATION : receives
  FORM_DEFINITION ||--o{ APPLICATION : based_on
  APPLICATION ||--o{ APPLICATION_PAGE_DATA : contains
  APPLICATION ||--o{ ATTACHMENT : has
  APPLICATION ||--o{ APPLICATION_AUDIT_LOG : audits
  APPLICATION ||--o{ APPOINTMENT : schedules
  USER ||--o{ NOTIFICATION : receives
  TENANT ||--o{ EMAIL_OUTBOX : sends
  APPLICATION ||--o{ PDF_ARTIFACT : generates
  APPLICATION ||--o{ OCR_JOB : ocr
~~~

## Статусы и блокировки (MVP)

### Список статусов (рекомендация)
- DRAFT
- SUBMITTED_INCOMPLETE
- SUBMITTED_COMPLETE
- UNDER_REVIEW
- SCHEDULED
- IN_PROGRESS
- COMPLETED
- CANCELLED

### Правило блокировки Endkunde
- Endkunde может редактировать, пока статус ∈ {DRAFT, SUBMITTED_INCOMPLETE, SUBMITTED_COMPLETE, UNDER_REVIEW}
- Endkunde НЕ может редактировать, если статус ∈ {SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED}
(основание: «до начала bearbeitung installateur»; считаем что назначение термина = начало работы)

### Критическое правило soft_required
- Переход в UNDER_REVIEW / SCHEDULED / IN_PROGRESS разрешен только если статус = SUBMITTED_COMPLETE.
- SUBMITTED_INCOMPLETE — только просмотр/комментарии, но без старта обработки.

## State machine (Mermaid)

~~~mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> SUBMITTED_INCOMPLETE: submit (soft missing)
  DRAFT --> SUBMITTED_COMPLETE: submit (no soft missing)
  SUBMITTED_INCOMPLETE --> SUBMITTED_COMPLETE: customer completes soft-required + resubmit/confirm
  SUBMITTED_COMPLETE --> UNDER_REVIEW: staff starts review
  UNDER_REVIEW --> SCHEDULED: set appointment
  SCHEDULED --> IN_PROGRESS: installer starts
  IN_PROGRESS --> COMPLETED: finalize
  DRAFT --> CANCELLED: customer cancel
  SUBMITTED_INCOMPLETE --> CANCELLED: customer cancel
  SUBMITTED_COMPLETE --> CANCELLED: admin cancel
  UNDER_REVIEW --> CANCELLED: admin cancel
~~~

## Кто может менять статус (матрица)

| Переход | Endkunde | Installateur | Stadtwerke Staff | Stadtwerke Admin | Platform Admin |
|---|---:|---:|---:|---:|---:|
| DRAFT → SUBMITTED_* | ✅ | ❌ | ❌ | ❌ | ❌ |
| SUBMITTED_INCOMPLETE → SUBMITTED_COMPLETE | ✅ | ❌ | ❌ | ❌ | ✅ (support) |
| SUBMITTED_COMPLETE → UNDER_REVIEW | ❌ | ❌ | ✅ | ✅ | ✅ |
| UNDER_REVIEW → SCHEDULED | ❌ | ✅ (если есть право) | ✅ | ✅ | ✅ |
| SCHEDULED → IN_PROGRESS | ❌ | ✅ | ✅ (если нужно) | ✅ | ✅ |
| IN_PROGRESS → COMPLETED | ❌ | ✅ | ✅ | ✅ | ✅ |
| * → CANCELLED | ✅ (до SCHEDULED) | ❌ | ❌ | ✅ | ✅ |

## Side effects (события)
- Создание draft: Notification staff (optional), запись lastActivityAt
- Submit: EmailOutbox (credentials + full data), PDF generation job, unreadByStaff = true, notification bell
- Staff edit: ApplicationAuditLog, unread maybe false? (если viewed)
- Appointment set: email customer + notification staff/installateur

## Retention (привязка к статусам)
- DRAFT: delete after 2 days inactivity
- SUBMITTED_INCOMPLETE: delete after 1 month inactivity
- COMPLETED: keep 10 years then delete/archival (founder requirement)
- CANCELLED: delete after 90 days (рекомендация)
