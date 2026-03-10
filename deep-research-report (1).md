# Пакет документов для реализации MVP white‑label Kundenportal для немецких Stadtwerke

## Реестр внешних стандартов и организаций, упоминаемых в документах

- entity["organization","W3C","web standards body"] (WCAG 2.2)  
- entity["organization","European Union","supranational union"] (GDPR / Regulation (EU) 2016/679)  
- entity["organization","ETSI","european standards body"] (EN 301 549)  
- entity["organization","OWASP","application security org"] (cheat sheets / ASVS)  
- entity["company","Amazon Web Services","cloud provider"] (S3/SES/Textract и инфраструктура)  
- entity["country","Germany","de"] (рынок и применимые нормы)

---

## Продукт и доменная модель

```md
01-product-requirements.md
# PRD: MVP white-label Kundenportal для Stadtwerke

> ВАЖНО (для копирования в репозиторий):
> В этом пакете, чтобы избежать вложенных ``` в одном ответе, блоки кода и диаграммы помечаются через ~~~.
> В самом репозитории можно заменить ~~~ на ``` (если ваш markdown-renderer требует именно ```).

## Executive summary

Мы строим multi-tenant white-label платформу для цифровизации бюрократических процессов немецких Stadtwerke (вместо бумажных писем). MVP должен:
1) быть demo-ready для продаж и переговоров,
2) быть production-ready по архитектурным основаниям (multi-tenant, безопасность, audit, доступность, i18n),
3) позволять быстро подключать новых клиентов (Stadtwerke) через конфигурацию темы и форм.

Ключевая фича MVP: полный end-to-end workflow заявки (Antrag) от создания черновика в Kundenportal до обработки сотрудниками Stadtwerke/Installateur и закрытия — с PDF-выводом «как на бумаге», soft_required логикой и строгой барьерной доступностью.

## Цели и этапы

### Цели MVP (демо → первые контракты → production foundation)
- Показать полностью работающий workflow на реальных типах форм:
  - Hausanschluss
  - Leistungserhöhung
  - Stilllegung
  - Bankdaten/SEPA (как отдельная форма)
- Подключить первых клиентов через:
  - tenant theme JSON (логотип/цвета/шрифты)
  - tenant form overrides JSON (операции изменения базовых шаблонов)
  - кастомные email templates по tenant
- Формальная доступность (barrierefrei) и i18n сразу (de/en/tr/es).

### Не-цели MVP (явно исключить)
- Интеграции ELSTER/SAP/ERP (не делаем).
- Продвинутые календарные интеграции (reschedule/reminders/calendar sync) — только дизайн «расширяемо».
- Масштабный OCR production-модуль — только небольшая demo-страница с human verification.

## KPI (измеримые)

### Demo/продажи
- TTFD (time-to-first-demo): запуск demo стенда < 14 дней после старта разработки.
- Demo completeness: 100% критических user flows (см. раздел «Сценарии»), без ручных «обходов».
- Onboarding readiness: новый tenant подключается за ≤ 60 минут через админ UI + конфиги (без кодинга).

### Продуктовые
- Conversion completion: ≥ 70% пользователей доходят до финального submit в демо.
- Draft resume rate: ≥ 30% (пользователь возвращается по креденшлам и дозаполняет).
- Среднее время заполнения: Hausanschluss ≤ 15 минут (без загрузки сложных документов).

### Качество/инженерия
- E2E coverage: 100% критических сценариев (Playwright).
- A11y: 0 критических нарушений axe-core на ключевых страницах.
- Error budget: 0 console errors on production build.

## Пользователи и роли (MVP)

### Роль: Endkunde (внешний пользователь)
- Заполняет wizard-формы (по шагам).
- Soft required: может пропустить на шаге, но заявка блокируется от обработки пока не заполнит.
- Autosave на переходах страниц.
- После финального сохранения/submit получает на email креденшлы (tracking code + password), входит и дозаполняет/проверяет статус.
- Может менять данные до начала обработки Installateur’ом (см. статус-модель).
- Может скачать PDF заявки «как на бумаге» + PDF SEPA/Bankdaten (если применимо).

### Роль: Installateur (внутренняя роль tenant Stadtwerke)
- Логинится как сотрудник.
- Видит только заявки своего tenant.
- Имеет права (по умолчанию и настраиваемые в будущем) на:
  - работу со «своими» назначенными заявками,
  - выбор/подтверждение термина (в MVP вручную),
  - смену стадий «в работе/завершено».

### Роль: Stadtwerke Admin (админ tenant)
- Управляет приглашениями пользователей своего tenant.
- Управляет правами Installateur и сотрудников (пермиссии через UI: включить/выключить чекбоксами).
- Управляет кастомизацией форм и тем (через UI над базовыми шаблонами) — MVP-light.

### Роль: Platform Admin (наш админ)
- Кросс-tenant доступ.
- Создает tenant и назначает Stadtwerke Admin.
- Управляет глобальными настройками/сервисами.

## Мульти-тенантность и брендинг

- Public Kundenportal: под брендом Stadtwerke (лого/цвета/шрифты) и открывается по ссылке формы (formId).
- Backoffice: под нашим брендом (но отображает tenant в контексте данных).
- Landing page: под нашим брендом (маркетинговая).

Tenant config (обязательно):
- logo (URL в storage)
- palette (primary/secondary/accent + нейтральные)
- fontFamily (опционально)
- baseFontSize (опционально)
- языки: de/en/tr/es (одинаковый набор для MVP; default de)

## Объем MVP (scope)

### Формы (обязательно)
- Hausanschluss
- Leistungserhöhung
- Stilllegung
- Bankdaten/SEPA

### Медиа (обязательно)
- Strom
- Gas
- Wasser/Abwasser
(архитектура должна позволять добавить Fernwärme позже без ломки)

### Страницы public portal (обязательно)
- Wizard step pages (страницы/шаги по форме)
- Review/Summary перед submit
- Final page с выдачей креденшлов + предупреждение о незаполненных soft-required
- Login page (по tracking code + password)
- Application status/detail page (после логина)
- PDF download action (кнопка рядом с Antrag)
- OCR demo page (отдельная, не критична для core flow, но включена как демонстрация)

### Страницы backoffice (обязательно)
- Login
- Dashboard (минимальный)
- Applications list (таблица/строки, фильтры, сортировка по дате)
- Application detail (readable view) + Edit Mode
- Admin: invitations
- Notifications bell (unread/new)
- Export: PDF per application, CSV per period

## Поведение wizard и жизненный цикл заявки

### Создание/обновление
- На первой странице пользователь вводит данные → после «Далее» создается draft в БД, присваивается applicationId.
- applicationId используется в query/URL (для продолжения сессии) и для последующих autosave.
- Каждый следующий шаг обновляет документ заявки (страница → свой JSON блок).
- Автосохранение: при клике «Далее/Назад»; отдельный autosave по таймеру не обязателен.

### Soft required семантика (строго)
- optional: можно оставить пустым всегда
- required: блокирует переход на следующий шаг
- soft_required:
  - при попытке уйти со страницы: предупреждение (modal/inline callout) + подсветка (желтая) незаполненных полей
  - пользователь может «Skip» и идти дальше
  - на summary — повторное предупреждение
  - после submit заявка получает статус SUBMITTED_INCOMPLETE и НЕ может попасть в обработку (никаких действий installateur/staff кроме просмотра) пока не станет SUBMITTED_COMPLETE
  - в email после submit должно быть явное предупреждение о незавершенности (и что будет удалена через 1 месяц без активности)

### Доступ/креденшлы Endkunde
- Только после финального submit:
  - генерируем tracking code (публичный идентификатор) + password
  - отправляем email с полными данными заявки + креденшлы
  - пользователь логинится и дозаполняет/смотрит статус

### Retention / cleanup
- Draft (DRAFT) без submit: удалить через 2 дня (по lastActivityAt).
- SUBMITTED_INCOMPLETE без активности: удалить через 1 месяц inactivity.
- COMPLETED: хранить 10 лет (founder requirement).

## Статусы (верхнеуровнево; детально — в 03-domain-model...)

- DRAFT
- SUBMITTED_INCOMPLETE (после submit, но есть soft_required/обязательные вложения не добавлены)
- SUBMITTED_COMPLETE (все required+soft_required заполнены, можно начинать обработку)
- UNDER_REVIEW (staff)
- SCHEDULED (назначен термин)
- IN_PROGRESS (installateur выполняет)
- COMPLETED
- CANCELLED (опционально; если заявка отменена клиентом/админом до обработки)

Полный state machine + transitions и кто может менять — см. 03-domain-model-and-status-workflow.md.

## GDPR/consent (MVP)

- Обязательный шаг «Rechtliche Hinweise» перед submit:
  - согласие с Datenschutzerklärung (required checkbox)
  - согласие на обработку персональных данных для выполнения процесса (required checkbox)
  - согласие на email-коммуникацию (required checkbox, founder requirement)
- Все consent должны логироваться:
  - timestamp
  - версия текста (consentVersion)
  - язык
  - IP/UA (рекомендация; осторожно с минимизацией данных)

## User stories (ключевые)

### Endkunde
- Как Endkunde, я хочу выбрать медиа (Strom/Gas/Wasser), тип заявки (Neuer Anschluss / Änderung / Stilllegung), чтобы система показала релевантные страницы.
- Как Endkunde, я хочу загрузить документы по категориям (Lageplan/Grundrisse/…), чтобы Stadtwerke могли обработать Antrag.
- Как Endkunde, я хочу видеть ошибки сверху и у поля, чтобы быстро исправлять.
- Как Endkunde, я хочу пропускать soft_required поля (с предупреждением), чтобы продолжить, и дозаполнить позже.
- Как Endkunde, я хочу на финале получить креденшлы и иметь возможность вернуться и дозаполнить.
- Как Endkunde, я хочу скачать PDF «как бумажный бланк», чтобы иметь подтверждение.

### Stadtwerke Staff/Admin
- Как Staff, я хочу видеть список заявок с фильтрами по статусу и сортировкой по дате.
- Как Staff, я хочу на detail видеть читаемый формат и редактировать только в edit mode.
- Как Staff, я хочу видеть какие поля поменял сотрудник vs клиент (original vs changed) и иметь audit trail.
- Как Admin, я хочу приглашать сотрудников по email и назначать права, чтобы они видели только свой tenant.
- Как Admin, я хочу видеть новые заявки/непрочитанные через notification bell.
- Как Admin, я хочу скачать PDF заявки и выгрузить CSV за период.

### Installateur
- Как Installateur, я хочу видеть назначенные заявки и отметить «в работе/выполнено».
- Как Installateur, я хочу назначить термин (вручную), чтобы клиент получил email.

### Platform Admin
- Как Platform Admin, я хочу создавать tenants (P001, P002…) и выдавать доступ Stadtwerke Admin.
- Как Platform Admin, я хочу управлять базовыми шаблонами форм и публикацией версий.

## Deliverables (что должно быть готово в MVP)

1) Public Kundenportal:
- Wizard pages для всех MVP forms и медиа
- Soft required logic
- Autosave
- Summary/Review
- Final credentials page
- Login по tracking code + password
- Status page
- PDF download
- OCR demo

2) Backoffice:
- Auth staff
- Dashboard (минимальный)
- List + filters + sorting
- Detail readable + edit mode
- Audit trail
- Invitations
- Notifications bell
- Export PDF/CSV

3) Platform foundation:
- Multi-tenant isolation
- Tenant theme + form overrides
- i18n de/en/tr/es
- Accessibility compliance baseline
- Email delivery + шаблоны per tenant/language
- Background jobs (cleanup, email, pdf generation)

## Задачи по ролям (MVP)

| Роль | Задачи | Выход |
|---|---|---|
| Product Owner | финализировать scope, статус-модель, тексты consent, контент landing | PRD, тексты, приоритеты |
| Designer | дизайн-система, компоненты форм, patterns ошибок/soft-required, A11y, responsive | UI kit, макеты страниц |
| Frontend Dev | Kundenportal wizard + backoffice UI + i18n + theming + a11y | React/Next apps |
| Backend Dev | API, auth, RBAC, tenant isolation, form engine runtime, pdf/email jobs | сервисы + БД |
| QA | тест-план, E2E flows, a11y тесты, visual regression | Playwright/axe/percy |
| DevOps | Docker, CI/CD, environments, secrets, AWS infra | GitHub Actions, ECS/RDS/S3 |

## Acceptance criteria (жестко)

- 100% критических user flows проходят (см. 11-testing-strategy.md).
- Мульти-тенантность: ни один staff не может увидеть данные другого tenant (проверено тестами).
- Soft required:
  - можно пропустить на шаге
  - заявка после submit не переходит в обработку пока soft_required не заполнены
  - пользователь может вернуться по креденшлам и дозаполнить
- PDF:
  - генерируется и скачивается из Kundenportal и backoffice
  - визуально соответствует бумажному бланку (MVP-уровень точности)
- A11y:
  - keyboard-only навигация по wizard
  - корректные labels/errors
  - axe: 0 critical, 0 serious (на ключевых страницах)
- i18n:
  - переключение языка в любой момент без потери данных
  - email templates для 4 языков
- Retention:
  - draft удаляется через 2 дня inactivity
  - incomplete submitted удаляется через 1 месяц inactivity
  - completed хранится 10 лет

## Тестовые сценарии (кратко)
- Создание draft после 1-го шага.
- Required блокирует переход; soft_required предупреждает, но пропускается.
- Выбор media включает/выключает набор страниц (Strom включает technical pages).
- File upload по категориям, ограничения 16MB, форматы PDF/PNG/JPG/JPEG/HEIC.
- Consent step required.
- Submit → email + credentials + статус SUBMITTED_INCOMPLETE при незаполненных soft_required.
- Backoffice: список/filters/sort; unread подсветка; detail view; audit trail.
- Экспорт PDF/CSV.
- Cleanup jobs.

```

```md
03-domain-model-and-status-workflow.md
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

```

Нормативная база и источники для продукта/доменной части: BFSG/BFSGV (обязательность доступности и дата применения), информация федеральных органов Германии, WCAG 2.2, EN 301 549 как европейская норма, GDPR как регламент по данным. citeturn0search0turn0search8turn0search12turn0search1turn0search3turn0search6

---

## Архитектура и API

```md
02-system-architecture.md
# System architecture (MVP)

## Executive summary

Рекомендация для MVP: единый TypeScript/Node стек end-to-end (React frontend + Node backend), PostgreSQL как единственная БД (с JSONB для динамических форм/данных), S3 как storage, SES для email. Это дает:
- максимальную скорость разработки (приоритет),
- минимизацию рассинхронизации схем (zod/shared types),
- проще PDF generation (headless Chromium),
- проще multi-tenant и audit.

C# (ASP.NET Core) допустим, но увеличит стоимость поддержки (двойные модели/валидации, меньше reuse) — см. раздел «Альтернативы».

## Deliverables
- Архитектурное решение (stack + rationale)
- Модель multi-tenant
- DB choice rationale (Mongo vs Postgres+JSONB)
- PDF/OCR/email/event/jobs architecture
- Docker + локальный запуск
- CI/CD (GitHub Actions) и деплой (AWS)

## Рекомендованный стек (конкретно)

### Runtime / языки
- Node.js: LTS ветка (рекомендация: Active LTS на момент старта проекта)
- TypeScript: latest stable (фиксировать в lockfile)

### Frontend (3 приложения)
1) Kundenportal (public, tenant-branded):
- Next.js + React (App Router)
- react-hook-form + zod
- tanstack/react-query
- next-intl (i18n)
- Tailwind CSS + CSS variables for theming
- Radix UI primitives (a11y-friendly компоненты)
- Playwright (E2E), axe-core (a11y)

2) Backoffice (our-branded):
- тот же стек, отдельный app
- Data grid (tanstack table)
- RBAC guards UI

3) Landing page (our-branded):
- Next.js SSR/SSG, i18n (минимум EN/DE)

### Backend
- NestJS (Fastify adapter) или Fastify напрямую (рекомендация: NestJS для структурности/DI/guards)
- OpenAPI (генерация клиентов)
- Zod validation на входе API
- Background jobs: pg-boss (очереди в Postgres) или BullMQ+Redis (рекомендация: pg-boss чтобы не тащить Redis в MVP)
- PDF worker: отдельный контейнер service (см. 07-pdf...)

### Инфраструктура
- Docker-first
- AWS:
  - RDS PostgreSQL
  - S3 (uploads, logos, pdf)
  - SES (email)
  - ECS Fargate (app containers)
  - CloudWatch Logs
  - Secrets Manager / SSM
(Для VPS: docker-compose prod — как fallback)

## Почему Node/TS, а не C# (обоснование)

### Node/TS — плюсы
- Единая модель типов/валидаций: schema → zod → клиент/сервер без дубля.
- Быстрее итерации UI + form engine.
- PDF generation и headless Chromium нативно и проще.
- Команда/основатель уже глубоко в TS.

### C# — когда выбирать
- Если Stadtwerke требуют .NET экосистему, интеграцию с их Active Directory и enterprise policies.
- Если планируется крупная команда backend C# инженеров.

### Рекомендация
Для MVP: Node/TS. Для Enterprise-переезда возможно выделить отдельные сервисы позже.

## Multi-tenant модель (MVP)

### Принцип
- Tenant определяется:
  - в Kundenportal по formId → formId однозначно маппится на tenantId и effective schema (base+override).
  - в Backoffice по membership userId→tenantId.

### Изоляция данных
- Во всех таблицах есть tenant_id.
- Все запросы обязаны фильтровать по tenant_id на сервере (guards).
- Отдельный «Platform Admin scope» может видеть все tenants.

### Рекомендация усиления (опционально)
- Postgres Row-Level Security (RLS) с установкой current tenant в session.
- Если RLS сложно с ORM — минимум: интеграционные тесты на IDOR/tenant breakout.

## Выбор БД: MongoDB vs PostgreSQL+JSONB

### Требования данных
- Транзакционные сущности (users, invites, audit logs, statuses, notifications).
- Гибкие данные форм (page data, schema json, overrides).
- Фильтры/сортировка списка заявок (по статусам/датам/типа формы).
- Retention jobs, аудиты, экспорты.

### MongoDB — плюсы/минусы
+ удобно хранить изменяемые документы
- сложнее обеспечить строгую целостность связей (audit, invitations, permissions)
- сложнее делать сложные отчеты/экспорты/joins (или дороже)

### PostgreSQL+JSONB — плюсы/минусы
+ одна БД для всего MVP
+ сильная целостность, индексы, транзакции, отчеты
+ JSONB покрывает динамический schema/data
- чуть больше дисциплины в моделировании

### Рекомендация
PostgreSQL как единственная БД. JSONB для:
- form schema
- form overrides
- page data
- template payloads

## File storage (S3)

- Все uploads (документы, логотипы, PDF артефакты) — в S3.
- Upload flow:
  1) backend выдает presigned URL/POST
  2) frontend загружает напрямую в S3
  3) backend фиксирует Attachment метаданные
- Ограничения:
  - max 16MB на файл (как в legacy)
  - типы: PDF/PNG/JPG/JPEG/HEIC

## PDF generation

- Вынести в отдельный сервис/worker (pdf-service):
  - получает applicationId + template kind
  - строит HTML (React server rendering или handlebars)
  - headless Chromium → PDF
  - сохраняет PDF в S3
- PDF должен выглядеть «как бумага» (см. 07)

## OCR demo (минимальный)

- Отдельная страница /ocr-demo в Kundenportal (или landing).
- Пользователь загружает фото счетчика/бумажки.
- Backend запускает OCR job:
  - вариант A (рекомендация для demo): Tesseract (контейнер)
  - вариант B (для лучшей точности): AWS Textract
- UI показывает извлеченные числа и требует подтверждения пользователя.

## Event model + background jobs

### Domain events (минимум)
- ApplicationDraftCreated
- ApplicationPageSaved
- ApplicationSubmitted
- CredentialsIssued
- StaffFieldEdited
- AppointmentScheduled
- ApplicationCompleted

### Реализация (MVP)
- Outbox таблица (event_outbox) + worker polling (pg-boss).
- Потребители:
  - email worker
  - pdf worker
  - cleanup worker (retention)
  - notification worker

## Локальный запуск (developer experience)

### Требования
- Docker Desktop
- Node LTS
- pnpm

### Команды (рекомендация структуры монорепо)
- pnpm install
- docker compose up -d (postgres + localstack/minio optional)
- pnpm db:migrate
- pnpm dev (apps)

## CI/CD (GitHub Actions) — high level

Стейджи:
1) lint + typecheck
2) unit + component tests
3) API tests
4) E2E (Playwright) + axe
5) build Docker images
6) push to registry
7) deploy (ECS)
8) run migrations

Детальный pipeline — в 11/13 и пример в 02/14.

```

```md
05-api-spec.md
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

```

Источники для архитектуры файлов/почты/PDF/OCR/адресов: S3 presigned uploads, SES SendEmail, Puppeteer PDF, Nominatim policy, Google Places, Textract, Tesseract. citeturn1search0turn1search1turn1search3turn2search2turn2search3turn2search0turn2search1

---

## Form engine и UX

```md
04-form-engine-spec.md
# Form engine spec (JSON templates + operations), validation, conditional logic

## Executive summary

Form engine — ядро продукта:
- Базовые формы задаются JSON schema (form/page/section/field).
- Для каждого tenant есть overlay JSON (operations) для модификации базового шаблона.
- В runtime строится effective schema = base template + tenant override.
- Валидируем на фронте и на беке одинаковой семантикой (zod runtime validation generated from schema rules).

## Deliverables
- JSON schema структуры
- Semantics required/soft_required/optional
- Conditional visibility + dynamic requiredness
- Layout grid 1–12 + responsive
- Operations JSON (patch) + примеры
- Zod validation примеры
- Address autocomplete варианты интеграции

## Основная модель

### Иерархия
- form
  - pages[]
    - sections[]
      - fields[] (или blocks[])

### Field identity and addressing
- Каждый field имеет уникальный id в рамках form.
- FieldPath для audit/validation: "pageKey.sectionKey.fieldId" (или "data.contact.email").

Рекомендация: хранить user-entered data в едином JSON дереве `applicationData`, а field definitions ссылаться на `bind.path`.

## JSON schema: FormDefinition (пример)

~~~json
{
  "form": {
    "key": "hausanschluss",
    "version": 1,
    "titleI18nKey": "forms.hausanschluss.title",
    "descriptionI18nKey": "forms.hausanschluss.description",
    "availability": {
      "media": ["strom", "gas", "wasser"]
    },
    "pages": [
      {
        "key": "antragsdetails",
        "titleI18nKey": "pages.antragsdetails.title",
        "order": 10,
        "softRequiredLeaveWarningI18nKey": "softRequired.leaveWarning",
        "sections": [
          {
            "key": "medium",
            "titleI18nKey": "sections.medium.title",
            "blocks": [
              {
                "type": "info",
                "id": "info_project",
                "contentI18nKey": "pages.antragsdetails.info"
              },
              {
                "type": "field",
                "id": "selectedMedia",
                "fieldType": "checkbox_group",
                "bind": { "path": "antragsdetails.selectedMedia" },
                "requirement": "required",
                "options": [
                  { "id": "strom", "labelI18nKey": "media.strom" },
                  { "id": "gas", "labelI18nKey": "media.gas" },
                  { "id": "wasser", "labelI18nKey": "media.wasser" }
                ],
                "validation": {
                  "minItems": 1,
                  "maxItems": 3
                },
                "layout": { "md": { "col": 12 }, "sm": { "col": 12 } }
              }
            ]
          },
          {
            "key": "antragsart",
            "titleI18nKey": "sections.antragsart.title",
            "blocks": [
              {
                "type": "field",
                "id": "requestType",
                "fieldType": "radio_group",
                "bind": { "path": "antragsdetails.requestType" },
                "requirement": "required",
                "options": [
                  { "id": "new_connection", "labelI18nKey": "requestType.new" },
                  { "id": "change_connection", "labelI18nKey": "requestType.change" },
                  { "id": "stilllegung", "labelI18nKey": "requestType.stilllegung" }
                ]
              },
              {
                "type": "field",
                "id": "changeKind",
                "fieldType": "select",
                "bind": { "path": "antragsdetails.changeKind" },
                "requirement": "required",
                "visibleWhen": {
                  "all": [
                    { "path": "antragsdetails.requestType", "op": "equals", "value": "change_connection" }
                  ]
                },
                "options": [
                  { "id": "anlagen_erweiterung", "labelI18nKey": "changeKind.erweiterung" },
                  { "id": "zusammenlegung", "labelI18nKey": "changeKind.zusammenlegung" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
~~~

## Requirement levels

- requirement: "optional" | "required" | "soft_required"

### Semantics на уровне страницы
- Page submit (Next):
  - required: блокирует
  - soft_required: предупреждает, но разрешает продолжить
- Form final submit:
  - если есть soft_missing: статус SUBMITTED_INCOMPLETE
  - если нет: SUBMITTED_COMPLETE

## Validation rules (унифицированно)

### Объект `validation`
Поддерживаем:
- string: minLength, maxLength, regex, email, phone
- number: min, max
- date: minDate, maxDate
- array: minItems, maxItems
- enum/option: allowedOptionIds
- iban/bic: специализированные validators
- file: allowedMimeTypes, maxSizeBytes, maxFiles
- cross-field: выражения на form-level `formValidationRules[]`

### Zod mapping (пример)

~~~ts
import { z } from "zod";

const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/; // MVP-level, refine later

export const fieldToZod = (field) => {
  switch (field.fieldType) {
    case "text": {
      let s = z.string();
      if (field.validation?.minLength) s = s.min(field.validation.minLength);
      if (field.validation?.maxLength) s = s.max(field.validation.maxLength);
      if (field.validation?.regex) s = s.regex(new RegExp(field.validation.regex));
      if (field.validation?.email) s = s.email();
      return s;
    }
    case "iban":
      return z.string().regex(ibanRegex, "invalid_iban");
    // ...
  }
};
~~~

## Conditional logic

### Supported operators (рекомендация)
- equals, not_equals
- in, not_in
- exists, not_exists
- greater_than, less_than (для numbers/dates)
- contains (для checkbox groups)

### Condition groups
- { all: Condition[] } = AND
- { any: Condition[] } = OR
- можно вложенно

### Conditional effects (MVP)
- visibleWhen
- requirementWhen (динамический required/soft_required)
- optionsWhen (менять options)
- pageEnableWhen (показывать/скрывать страницы)

## Layout grid 1–12

### Модель layout
- layout: { xs?: {col}, sm?:..., md?:..., lg?:... }
- col: 1..12
- row grouping: implicit by order, либо explicit `rowKey`

## Repeating groups (arrays) — важны для wallbox и т.п.

Пример: список wallbox элементов (power/count):

~~~json
{
  "type": "field",
  "id": "wallboxItems",
  "fieldType": "repeatable_group",
  "bind": { "path": "tech.strom.wallbox.items" },
  "requirement": "soft_required",
  "itemSchema": {
    "fields": [
      { "id": "powerKw", "fieldType": "number", "requirement": "required", "validation": { "min": 0, "max": 500 } },
      { "id": "count", "fieldType": "number", "requirement": "required", "validation": { "min": 1, "max": 100 } }
    ]
  },
  "ui": {
    "addButtonI18nKey": "common.add",
    "removeButtonI18nKey": "common.remove"
  }
}
~~~

## Upload blocks (категории)

~~~json
{
  "type": "field",
  "id": "attachments_lageplan",
  "fieldType": "file_upload",
  "bind": { "path": "attachments.lageplan" },
  "requirement": "required",
  "validation": {
    "maxFiles": 5,
    "maxSizeBytes": 16777216,
    "allowedMimeTypes": ["application/pdf", "image/png", "image/jpeg", "image/heic"]
  },
  "ui": {
    "categoryKey": "lageplan",
    "descriptionI18nKey": "uploads.lageplan.description"
  }
}
~~~

## Operation JSON (tenant overrides)

### Operation types (MVP)
- addField
- removeField
- updateField
- moveField
- addPage
- removePage
- updateValidation
- updateVisibility
- updateRequirement
- updateOptions
- addHintBlock

### Path addressing
- target: { pageKey, sectionKey, fieldId } OR jsonPath-like string (рекомендация: явная адресация)

### Пример override: сделать поле soft_required вместо required + добавить hint

~~~json
{
  "baseFormKey": "hausanschluss",
  "operations": [
    {
      "op": "updateRequirement",
      "target": { "pageKey": "kontaktdaten", "fieldId": "phoneAdditional" },
      "value": "soft_required"
    },
    {
      "op": "addHintBlock",
      "target": { "pageKey": "kontaktdaten", "sectionKey": "antragsteller" },
      "afterFieldId": "email",
      "value": {
        "type": "info",
        "id": "hint_email",
        "contentI18nKey": "tenant.P001.hints.email"
      }
    }
  ]
}
~~~

## Address autocomplete / exact address validation

### Варианты (MVP)
A) Google Places Autocomplete (коммерческий, лучший UX)
B) OpenStreetMap Nominatim (бесплатно, но жесткий rate limit и policy)
C) Self-hosted geocoder (Photon/Pelias) — лучше для production, дороже по времени

### Рекомендация
- Для demo и low volume: Nominatim + caching (и соблюдение policy).
- Для production: Google Places или self-hosted.

### Интеграция (общая)
- Frontend: typeahead + selection → заполняем street/houseNumber/plz/city/country + normalized label.
- Backend: хранить:
  - displayAddress (string)
  - components (street, houseNumber, ...)
  - providerMeta (placeId/osmId, lat/lon)
  - verified=true если получено из provider.

## Soft_required details (UX + data)

- При уходе со страницы:
  - server возвращает softMissing[] → UI подсвечивает желтым + показывает modal
- На summary:
  - агрегируем missing по страницам + показываем список «что еще заполнить»
- При submit:
  - если softMissing > 0: SUBMITTED_INCOMPLETE, processingLocked=true
  - если 0: SUBMITTED_COMPLETE

```

```md
06-ux-ui-guidelines.md
# UX/UI guidelines (Kundenportal + Backoffice), theming, i18n, error patterns

## Executive summary

UI должен быть:
- современный, но сдержанный,
- максимально плавный и понятный,
- строго доступный (keyboard + screen reader),
- white-label на public portal,
- «наш бренд» в backoffice,
- повторять удачные паттерны legacy (stepper, info blocks, error summary, upload categories, summary page),
- исправить слабые места: ясность, скорость, ошибки, чистота.

## Deliverables
- Inventory страниц
- UI patterns (form fields, errors, soft_required, stepper)
- Theming JSON + применение
- i18n правила
- A11y правила на компоненты
- Спека отображения PDF/экспортов в UI

## Страницы: Kundenportal (public)

### Общие элементы layout
- Header:
  - tenant logo (из theme config)
  - language switcher (de/en/tr/es)
  - optional: high-contrast toggle + font scale toggle (см. A11y)
- Footer:
  - links: Datenschutzerklärung, Impressum, Barrierefreiheitserklärung
- Container:
  - max-width, readable typography
  - responsive spacing

### Wizard flow pages (пример структуры из legacy)
- Stepper (горизонтально; на mobile — выпадающий/бургер)
- Page-level error summary сверху (красный блок «Fehler/Warnungen…»)
- Sections с заголовками (синие хедеры в legacy — можно модернизировать)
- Info blocks внутри секций
- Field-level messages под полем

### Обязательные шаги (для Hausanschluss, референс legacy)
1) Antragsdetails
   - Medium checkbox group (Strom/Gas/Wasser)
   - Antragsart radio (Neuer Anschluss / Änderung / Stilllegung)
   - conditional: Art der Veränderung select (если Änderung)
   - Wunschtermin (date required)
   - Message textarea (max 255)
2) Anschlussort
   - Address fields: PLZ/Ort/Ortsteil/Strasse/Hausnr/Hausnr Zusatz
   - checkbox: «Straße oder Hausnummer noch nicht bekannt» → alternative fields Gemarkung/Flur/Flurstück (рекомендация)
   - Anschlussobjekt: Gebäude/Freifläche/Sonstiges
   - conditional building details (EFH/MFH/Gewerbe; Nutzung; Keller; Baujahr; Flächen)
   - Upload categories (Lageplan/Grundrisse/Flurkarte/Sonstiges), max 16MB, formats
3) Kontaktdaten
   - Antragsteller: Anrede/Vorname/Name/Name Zusatz/Adresse/Telefon/E-Mail + confirm email
   - Technischer Ansprechpartner: applicant is contact? yes/no
   - Grundstückseigentümer/Erbbauberechtigter: yes/no + hint
   - Rechnungsempfänger: yes/no
   - Upload категория (если нужно)
4) Technische Daten
   - Subtabs по media:
     - Strom:
       - Elektroinstallateur selection (registered list / guest / unknown)
       - Zustimmungspflichtige Geräte: wallbox, pv, storage, kwk, wp, klima (повторяемые группы)
     - Wasser:
       - Wasserinstallateur
       - Wasserverbraucher
     - Gas: аналогично позже (ausbaufähig)
5) Rechtliche Hinweise (consent)
   - required checkboxes
6) Übersicht (review)
   - секции со сводкой и warning markers
   - кнопка «Angaben bearbeiten» (возврат к шагу)
   - «Angaben speichern» (submit)
7) Final page
   - показ tracking code + пароль
   - список «Fehlende Informationen» с ссылками «anzeigen»
   - CTA: «войти снова и продолжить»

## Страницы: Backoffice (our-branded)

### Dashboard (минимум)
- карточки:
  - New/Unread applications count
  - Incomplete submitted count
  - Scheduled today count (если есть)
- ссылку на list с преднастроенными фильтрами

### Applications list
- таблица (rows):
  - createdAt, trackingCode, formKey, media, status, unread badge
  - customer summary (имя/адрес) — минимально, учитывая privacy
- filters:
  - status, formKey, media, unread, date range
- sorting:
  - по дате (default desc)
- row click → detail
- bulk actions: не делаем в MVP

### Application detail
- Read mode по умолчанию (читаемый)
- Button: «Edit» → edit mode
- Toggle: «Show original values» (original vs staffModified)
- Audit panel (таблица изменений) + причина (если задана)
- Actions:
  - transition status (по правам)
  - set appointment (по правам)
  - download PDF
  - export attachments list

### Admin: invitations
- invite by email
- role select
- permissions чекбоксы (MVP: базовый набор + override)

### Notifications bell
- unread count
- list events (new application, submitted, appointment)

## Theming JSON (tenant)

~~~json
{
  "tenantCode": "P001",
  "logo": { "url": "s3://.../logo.png", "alt": "Stadtwerke ..." },
  "palette": {
    "primary": "#0B5FFF",
    "secondary": "#003A8C",
    "accent": "#FFB200",
    "bg": "#FFFFFF",
    "text": "#111111",
    "danger": "#B00020",
    "warning": "#B26A00"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "baseFontSizePx": 16
  }
}
~~~

Применение:
- CSS variables на :root портала, грузить theme по formId при первом запросе.

## Error patterns (required vs soft_required)

### Required
- Красный border + field message под полем.
- Page-level error summary с якорями к полям.

### Soft required
- Желтая подсветка поля + inline hint «можно заполнить позже».
- При попытке Next: modal:
  - список полей
  - кнопки: «Заполнить сейчас» / «Пропустить»
- На summary: warning callout «Антраг не будет обработан пока не заполните…».

ВАЖНО: цвет не единственный сигнал — добавить иконку/текст.

## Accessibility rules (high level)
Подробный чеклист — в 09-accessibility...
Здесь UX-правила:
- Все интерактивные элементы доступны с клавиатуры.
- Focus видим, не скрыт фиксированным header.
- Stepper поддерживает aria-current и понятные labels.
- Ошибки объявляются через aria-live.
- Modal traps focus.
- Upload: описать требования, статус загрузки, ошибки.

## i18n
- Все тексты через ключи.
- Form labels/help/hints — тоже i18n.
- При смене языка НЕ терять введенные данные.
- Email templates — i18n.

## PDF в UI
- В Kundenportal: кнопка «PDF скачать» доступна после submit (и в дальнейшем).
- В Backoffice: кнопка «Download PDF» всегда на detail.
- Если PDF еще генерируется: показываем статус и «обновить».

```

Источники для UX/A11y части: WCAG 2.2 (структура критериев и conformance), EN 301 549 как европейская норма, BFSG/BFSGV и федеральная информация о применимости. citeturn0search1turn0search3turn0search0turn0search12turn0search15

---

## Документы и коммуникации

```md
07-pdf-and-document-generation-spec.md
# PDF & document generation spec (paper-like output)

## Executive summary

PDF — обязательный deliverable: «как на бумаге сейчас, но автоматически заполненный».
Архитектура:
- Отдельный PDF worker service (headless Chromium).
- PDF templates per form family (APPLICATION_PDF, SEPA_PDF).
- Data mapping: applicationData + attachments metadata → template placeholders.
- Output: S3 artifact + доступ из портала/бэкофиса.

## Deliverables
- PDF generation pipeline
- Template strategy (HTML→PDF)
- Mapping dynamic fields → fixed paper layout
- Tenant branding in PDF
- SEPA mandate rendering spec
- Testing strategy for PDF output

## Strategy: HTML → PDF via headless Chromium

### Почему так
- максимальный контроль визуала
- можно добиться «бумажного» вида
- печатные CSS правила

### Service design
- pdf-service (контейнер):
  - принимает job: {tenantId, applicationId, kind, language}
  - fetch: theme + applicationData + schema
  - render HTML (server-side)
  - generate PDF
  - upload to S3
  - write PdfArtifact row

### Page setup
- A4
- margins fixed
- embedded fonts
- inline critical CSS

## Template подход

### Разделение
1) Form schema JSON (для UI)
2) PDF template (для бумаги)

PDF template хранить как:
- versioned React/JSX template в репозитории (рекомендация для MVP, быстрее)
- либо как HTML + placeholders (handlebars)
- tenant-specific PDF templates: не делаем, только branding (лого/цвета в header/footer)

### Template contract
- Каждому полю schema сопоставить:
  - PDF label (DE)
  - PDF position (x,y) или grid placement
  - formatting rules (uppercase, date format, etc)

Рекомендация MVP:
- использовать HTML table/grid layout вместо абсолютного позиционирования.
- максимально приблизить к бланку через:
  - фиксированные таблицы
  - линии для заполнения
  - light-gray input backgrounds

## Mapping dynamic fields → paper layout

### Общая схема
- applicationData: хранит значения в нормализованном JSON.
- mapper:
  - берет значения по path
  - применяет форматирование
  - заполняет соответствующие «ячейки» template

### Пример mapping spec (кусок)
~~~json
{
  "kind": "APPLICATION_PDF",
  "formKey": "hausanschluss",
  "version": 1,
  "fields": [
    {
      "path": "kontaktdaten.antragsteller.vorname",
      "pdfKey": "applicant_firstname",
      "format": "text"
    },
    {
      "path": "antragsdetails.wunschtermin",
      "pdfKey": "desired_date",
      "format": "date_de"
    }
  ]
}
~~~

## SEPA-Lastschriftmandat PDF (Bankdaten form)

### Поля (минимум)
- Zahlungsempfänger (pre-filled from tenant)
- Gläubiger-ID (pre-filled from tenant)
- Mandatsreferenz (system generated or tenant assigns; note: «separat mitgeteilt» — ок)
- Kontoinhaber:
  - Name/Vorname/Firma
  - Adresse
- Kreditinstitut
- IBAN (валидировать)
- BIC (валидировать)
- Einzug:
  - ab sofort / gültig ab (date)
- Zahlungsart:
  - einmalig / wiederkehrend
- Ort/Datum, Unterschrift (в digital flow: e-sign? MVP: checkbox «ich bestätige», но PDF все равно имеет место для подписи; recommendation: отметить «digital bestätigt»)

### Юридический текст
- включить стандартный SEPA mandate текст + возврат в 8 недель (как в бумажном)
- version контролировать

## Tenant branding in PDFs
- Лого tenant в header.
- Контактные данные tenant (адрес, email, телефон) в footer.
- Цветовая линия в primary color tenant (но не ломать контраст/печать).

## Storage / caching
- PDFs сохранять в S3:
  - s3://artifacts/{tenantCode}/{applicationId}/{kind}/v{templateVersion}/{timestamp}.pdf
- При повторном запросе:
  - если applicationData не менялся — отдавать существующий PDF.
  - если менялся — пересоздать (или создать новую версию).

## Usage in UI
- Customers: кнопка скачать после submit.
- Staff: всегда на detail.

## PDF testing
- Unit: mapper tests (path->value formatting).
- Integration: generate PDF from fixture application and сравнить:
  - размер файла > 0
  - ключевые строки присутствуют (минимум)
- Visual regression (рекомендация):
  - рендер PDF → PNG (на CI) → snapshot diff.

```

```md
08-email-and-notifications-spec.md
# Email + notifications spec (multilingual, tenant-specific)

## Executive summary

Email — критично: после submit отправляем фулл данные + креденшлы. Архитектура:
- шаблоны per tenant + per language,
- outbox таблица + worker,
- SES (или SendGrid как fallback) — отправка асинхронно,
- in-app notifications только для internal users (staff/admin/installateur).

## Deliverables
- список email типов
- template format
- event triggers
- in-app notifications model
- retry/dlq policy

## Email types (MVP)

1) APPLICATION_SUBMITTED
- получатель: Endkunde
- контент:
  - подтверждение submit
  - tracking code + временный пароль
  - предупреждение о неполноте (если SUBMITTED_INCOMPLETE)
  - полные данные заявки (структурированный блок)
  - ссылка на login и продолжение

2) APPOINTMENT_SCHEDULED
- получатель: Endkunde
- контент:
  - дата/время/таймзона
  - инструкции
  - ссылка на статус

3) APPLICATION_COMPLETED (опционально MVP)
- получатель: Endkunde
- контент:
  - статус «завершено»
  - PDF link

## Template storage (per tenant, per language)

~~~json
{
  "templateKey": "APPLICATION_SUBMITTED",
  "tenantId": "uuid",
  "language": "de",
  "subject": "Ihre Anfrage {{trackingCode}}",
  "preheader": "Zugangsdaten und Zusammenfassung Ihrer Angaben",
  "bodyText": "...",
  "bodyHtml": "<html>...</html>"
}
~~~

Рекомендация:
- хранить templates в БД (jsonb) чтобы Platform Admin мог менять без деплоя
- для MVP можно seed templates в коде и синхронизировать миграцией

## Email delivery architecture

### Outbox
- При событии создаем запись в EmailOutbox(PENDING).
- Worker:
  - читает PENDING
  - отправляет через SES
  - SENT/FAILED + attempts
  - exponential backoff
  - maxAttempts=10
  - после maxAttempts → FAILED + alert

### Что не делать
- не отправлять email синхронно в HTTP request.

## In-app notifications (backoffice)

### Types
- NEW_APPLICATION (после submit)
- APPLICATION_UPDATED (customer completed missing fields)
- APPOINTMENT_SCHEDULED (когда назначен термин)
- APPLICATION_COMPLETED

### UI
- bell icon в header
- badge count unread
- dropdown list:
  - title, time, link to application
- mark as read

### Delivery
- создаем Notification rows в БД на событии
- для realtime позже можно добавить websockets; в MVP polling при открытии страницы

## Multilingual
- Шаблоны обязательно для de/en/tr/es.
- Фразы/форматы дат — локализованные.

## Security notes
- Не отправлять permanent password в открытом виде.
Рекомендация реализации:
- email содержит временный пароль (валиден 24 часа) + требование смены при первом входе.

```

Источники: SES SendEmail API и общая документация, S3 подходи (для PDF links), best practice асинхронной доставки через outbox (как инженерная практика; без внешней нормы). citeturn1search1turn1search5turn1search0

---

## Compliance и безопасность

```md
09-accessibility-compliance-spec.md
# Accessibility compliance spec (WCAG 2.2 + Germany BFSG/BFSGV + EN 301 549)

## Executive summary

Цель: формальная, честная, проверяемая доступность Kundenportal (и ключевых частей backoffice) для немецкого рынка.
Baseline:
- WCAG 2.2 Level AA как целевой уровень.
- EN 301 549 как европейская норма требований к ICT.
- BFSG/BFSGV: обязательность доступности для соответствующих цифровых услуг с 28.06.2025.

MVP обязан:
- проходить автоматические a11y проверки (axe) без critical/serious,
- проходить ручные проверки keyboard-only и screen reader smoke,
- иметь Barrierefreiheitserklärung страницу.

## Deliverables
- чеклист требований по категориям
- таблица WCAG 2.2 критериев (релевантные для форм)
- автоматические тесты (axe)
- ручные тесты (keyboard/screen reader)
- acceptance criteria

## Нормативные опоры (кратко)
- BFSG/BFSGV: требования доступности для продуктов/услуг и дата применения.
- WCAG 2.2: критерии успеха и conformance.
- EN 301 549: технические требования для ICT (web и non-web документы).

## Инженерные требования (MVP)

### Навигация и управление (keyboard)
- все интерактивные элементы доступны с Tab/Shift+Tab
- логический порядок фокуса соответствует визуальному порядку
- нет ловушек фокуса (кроме корректного modal trap)
- stepper доступен: можно перейти к предыдущим шагам, текущий шаг отмечен

### Focus visibility
- контрастный focus ring
- focus не перекрыт фиксированными панелями (учесть WCAG 2.2 Focus Not Obscured)

### Формы
- каждое поле имеет связанную label (не placeholder)
- required/soft_required обозначены не только цветом (иконка + текст)
- ошибки:
  - page-level summary
  - field-level message
  - aria-live для обновления ошибок
- подтверждение email (двойное поле) — ошибка понятная и доступная

### Цвет/контраст/скейл
- контраст текста/иконок минимум AA
- UI корректно работает при browser zoom 200%
- элементы управления достаточного размера (target size)

### File upload
- доступный control (кнопка/label)
- статус загрузки доступен screen reader’у
- ошибки типа/размера сообщаются текстом

### Мультиязычность
- смена языка доступна клавиатурой
- lang атрибут на html обновляется
- направление текста (LTR) — по языку

### Документы PDF
- PDF generation не должен ломать доступность web UI.
(Доступность PDF как tagged PDF — НЕ требуется в MVP, но заложить как future.)

### Barrierefreiheitserklärung
- отдельная страница, описывает:
  - уровень соответствия
  - известные ограничения
  - контакт для жалоб/feedback

## WCAG 2.2 AA: релевантные критерии (MVP checklist)

Таблица: критерий → как реализуем → как тестируем.

| WCAG | Что значит | Реализация | Тест |
|---|---|---|---|
| 1.1.1 | текстовые альтернативы | alt для logo/иконок | axe + manual |
| 1.3.1 | семантика | правильные labels, fieldsets, legends | axe + screen reader smoke |
| 1.3.2 | meaningful sequence | DOM порядок соответствует layout | manual keyboard |
| 1.4.1 | не только цвет | ошибки/soft_required имеют текст | manual |
| 1.4.3 | контраст | palette constraints | automated contrast check + manual |
| 1.4.10 | reflow | responsive layout, no horizontal scroll | manual resize |
| 1.4.12 | text spacing | не ломать при увеличении межстрочных | manual |
| 2.1.1 | keyboard | все доступно | manual |
| 2.4.3 | focus order | шаги и поля | manual |
| 2.4.7 | focus visible | видим всегда | manual |
| 2.4.11 | focus not obscured | фикс header не перекрывает | manual |
| 2.5.8 | target size | кнопки/клики | manual |
| 3.3.1 | error identification | понятные ошибки | manual |
| 3.3.2 | labels/instructions | подсказки, required | manual |
| 3.3.3 | error suggestion | предложения исправления | manual |
| 4.1.2 | name/role/value | корректные компоненты | axe |

## Автоматические тесты (обязательные)

- Playwright + axe:
  - ключевые страницы Kundenportal (каждый шаг, summary, final)
  - backoffice login/list/detail
- Threshold:
  - 0 critical
  - 0 serious
  - minor/moderate допускаются только с ticket и планом исправления (в MVP лучше 0).

## Ручные тесты (обязательные)

### Keyboard-only
- пройти весь wizard:
  - заполнить required
  - получить soft_required warning
  - submit
  - login по креденшлам
- backoffice:
  - login
  - открыть заявку
  - edit mode + save

### Screen reader smoke (NVDA/JAWS/VoiceOver — минимум 1)
- прочитать структуру заголовков
- понять ошибки (summary + поле)
- загрузить файл
- сменить язык

## Acceptance criteria (a11y)
- Все критерии таблицы соблюдены.
- Автотесты проходят.
- Ручные тесты пройдены и задокументированы в 12-acceptance-checklist.md.

```

```md
10-security-and-privacy-spec.md
# Security & privacy spec (MVP)

## Executive summary

MVP обрабатывает чувствительные данные (PII + bank details + attachments). Требования:
- строгая multi-tenant изоляция
- безопасное хранение паролей
- защита сессий/JWT
- rate limiting
- audit log для staff edits
- минимизация данных (GDPR)
- retention: draft cleanup, incomplete cleanup, completed 10 years (founder requirement)

## Deliverables
- auth модели (staff + customer)
- password policy
- session/JWT policy
- data classification
- encryption at rest/in transit
- file upload security
- audit logging
- retention & deletion rules
- security тесты

## Auth

### Staff
- email + password
- MFA не требуется в MVP, но архитектурно предусмотреть (future)

### Customer (Endkunde)
- trackingCode + password после submit
- рекомендация: пароль временный (TTL 24h) + forced change на первом входе

## Password storage (обязательное)
- Argon2id (рекомендация параметров минимум как в OWASP; tuning по infra)
- уникальная соль
- ограничение attempts + lockout + captcha после N failed (MVP: rate limit)

## Sessions / JWT
- Access token short-lived (15 min)
- Refresh token (14 days) с rotation
- Idle timeout 14 days (founder preference) — допустимо при refresh rotation

## Rate limiting (обязательное)
- /auth/login: строгий лимит по IP + по account
- /public/auth/login: строгий лимит
- /attachments:presign: лимит чтобы не DDoS storage

## Multi-tenant isolation (обязательное)
- server-side checks на каждом запросе:
  - tenantId из token/membership
  - applicationId принадлежит tenantId
- запрет IDOR:
  - нельзя получить чужой application по id
- рекомендовано:
  - интеграционные тесты для tenant breakout
  - (опция) Postgres RLS

## Data classification

### Sensitive
- bank details (IBAN/BIC)
- passwords (hash)
- attachments (документы)
- PII (имя, адрес, email, телефон)

### Handling
- шифрование at rest: RDS + S3 SSE (AWS default, with KMS)
- in transit: TLS everywhere, HSTS
- logs: никогда не логировать PII полностью и никогда не логировать bank details

## Bank details security (рекомендация)
- В MVP можно хранить IBAN/BIC в Postgres в зашифрованном виде (application-level encryption):
  - envelope encryption с KMS
  - или libsodium secretbox с ключом из Secrets Manager
- Если не успеваем: минимум шифрование at rest + строгие ACL + masking в UI/logs.

## File upload security
- presigned URL с ограниченным временем жизни
- фиксированный key namespace tenant/application/category
- проверка mimeType и sizeBytes на backend до выдачи presign
- (опционально) антивирус скан (future)

## Audit logging (обязательное)
- Логировать только staff edits:
  - кто изменил
  - когда
  - какое поле
  - old/new
  - reason (желательно)
- UI показывает «изменено сотрудником»

## Consent
- хранить consent flags + consentVersion + timestamp + language
- consent обязателен перед submit

## Retention & deletion
- DRAFT: удалить через 2 дня inactivity
- SUBMITTED_INCOMPLETE: удалить через 1 месяц inactivity
- COMPLETED: хранить 10 лет
- требования реализовать через background job

## Security testing (минимум)
- dependency scanning (npm audit / osv)
- SAST (CodeQL)
- API tests на:
  - auth brute force (rate limit)
  - tenant isolation
  - CSRF (если cookies)
  - XSS (sanitize)
- OWASP ASVS L1/L2 subset checklist (для веб-форм)

```

Источники для security: OWASP Password Storage (Argon2id), OWASP Session Management, OWASP ASVS, JWT RFC; GDPR для принципов обработки/минимизации/безопасности. citeturn3search0turn3search1turn3search2turn3search7turn0search6

---

## QA и реализация

```md
11-testing-strategy.md
# Testing strategy (unit/component/api/e2e/a11y/visual)

## Executive summary

Quality bar: «всё покрыто тестами и работает end-to-end». Обязательные слои:
- Unit (utils, validation, mappers)
- Component (React Testing Library)
- API integration (supertest)
- E2E (Playwright)
- A11y automation (axe-core)
- Visual regression (Percy/Playwright snapshots)
CI обязан прогонять всё.

## Deliverables
- tooling и конфигурация
- test matrix по страницам/ролям
- список критических E2E flows
- примеры тестов (Jest/Playwright)
- CI gating rules

## Tooling (рекомендация)
- Unit: Vitest (быстрее) или Jest (если команда предпочитает)
- Component: React Testing Library
- API: supertest
- E2E: Playwright
- A11y: @axe-core/playwright
- Visual: Percy (или Playwright snapshot diff на SVG/PNG)

## Test environments
- Local: docker compose (postgres + app)
- CI: ephemeral postgres service контейнер
- Seed:
  - demo tenant P001
  - base forms + overrides fixtures
  - demo users: platform admin, tenant admin, staff, installateur

## Critical E2E flows (must-pass)

### Flow A: Draft → Submit incomplete → Resume → Complete
1) open public form link (formId)
2) step 1 заполнить required
3) next → draft created
4) на одном шаге оставить soft_required пустым → next (accept warning)
5) пройти consent
6) submit → получаем tracking code (из response mock) и email outbox created
7) login with tracking+password
8) дозаполнить missing soft_required
9) resubmit/confirm → status becomes SUBMITTED_COMPLETE

### Flow B: Backoffice processing
1) staff login
2) list filter SUBMITTED_COMPLETE
3) open application detail (read mode)
4) edit mode → change field → saves → audit record created
5) transition UNDER_REVIEW
6) schedule appointment → email outbox created
7) transition SCHEDULED → IN_PROGRESS → COMPLETED

### Flow C: Tenant isolation
1) staff tenant A login
2) attempt open applicationId from tenant B → 403/404
3) verify no leakage in list queries

### Flow D: PDF
1) after submit: request PDF
2) verify URL returned and download > 0 bytes

### Flow E: A11y smoke
- run axe on each wizard page + backoffice list/detail

## Sample unit test (validation rules)

~~~ts
import { describe, it, expect } from "vitest";
import { buildZodSchemaFromForm } from "@/form-engine/zodBuilder";

describe("form engine - zod builder", () => {
  it("enforces required field", () => {
    const schema = buildZodSchemaFromForm({
      fields: [{ id: "email", fieldType: "text", requirement: "required", validation: { email: true }, bind: { path: "x.email" } }]
    });
    const result = schema.safeParse({ x: { email: "" } });
    expect(result.success).toBe(false);
  });
});
~~~

## Sample Playwright + axe

~~~ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a11y: antragsdetails has no serious violations", async ({ page }) => {
  await page.goto("/public/forms/demo-form");
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(v => ["serious","critical"].includes(v.impact ?? ""));
  expect(serious).toEqual([]);
});
~~~

## API integration test (tenant isolation)

~~~ts
import request from "supertest";

it("denies cross-tenant application access", async () => {
  const tokenA = await loginAsStaffTenantA();
  const res = await request(app)
    .get(`/api/tenants/${tenantA}/applications/${applicationFromTenantB}`)
    .set("Authorization", `Bearer ${tokenA}`);
  expect([403,404]).toContain(res.statusCode);
});
~~~

## CI gating rules
- Любой PR:
  - lint/typecheck must pass
  - unit/component/api tests must pass
  - E2E must pass
  - a11y must pass (0 critical/serious)
- Main branch:
  - build + deploy only if all gates green

```

```md
12-acceptance-checklist.md
# Acceptance checklist (MVP готовность)

## Executive summary

Этот чеклист — финальное «да/нет» перед демо клиенту и перед первым onboarding.

## Functional (public portal)
- [ ] Wizard работает по шагам для всех MVP forms (hausanschluss/leistungserhöhung/stilllegung/bankdaten).
- [ ] Draft создается после 1-го шага и сохраняется в БД.
- [ ] Autosave на каждом переходе шага.
- [ ] Required блокирует переход, ошибки видны сверху и у поля.
- [ ] Soft_required: предупреждение при переходе, можно skip; подсветка + список полей.
- [ ] Summary перед submit показывает missing (soft + attachments).
- [ ] Consent step: все required чекбоксы обязательны.
- [ ] Submit:
  - [ ] выдает креденшлы (tracking+password)
  - [ ] отправляет email (outbox→sent)
  - [ ] ставит статус SUBMITTED_INCOMPLETE если есть soft_missing
- [ ] Login Endkunde по tracking+password.
- [ ] Endkunde может дозаполнить и довести до SUBMITTED_COMPLETE.
- [ ] PDF download доступен и файл валиден.

## Functional (backoffice)
- [ ] Staff login.
- [ ] Applications list:
  - [ ] фильтры статус/форма/медиа/unread/date
  - [ ] сортировка по дате
- [ ] Notification bell:
  - [ ] показывает unread count
  - [ ] кликабельно ведет к заявке
- [ ] Detail readable view.
- [ ] Edit mode:
  - [ ] сохраняет изменения
  - [ ] пишет audit log
  - [ ] UI показывает «изменено сотрудником»
- [ ] Original vs changed toggle работает.
- [ ] Status transitions работают по правам.
- [ ] Appointment scheduling:
  - [ ] создает appointment
  - [ ] email customer queued/sent
- [ ] Export:
  - [ ] PDF per application
  - [ ] CSV за период

## Non-functional
- [ ] Multi-tenant isolation: тесты подтверждают отсутствие утечек.
- [ ] i18n: de/en/tr/es, смена языка без потери данных.
- [ ] A11y: axe 0 serious/critical на ключевых страницах.
- [ ] Responsive + 200% zoom usable.
- [ ] Retention jobs:
  - [ ] drafts удаляются через 2 дня inactivity
  - [ ] submitted incomplete удаляются через 1 месяц inactivity
  - [ ] completed retention 10 лет (настройка/политика)
- [ ] CI/CD: pipeline green, deploy reproducible.
- [ ] Docker: локальный запуск по инструкции.

## Документация
- [ ] Все 15 md файлов присутствуют в repo.
- [ ] README с local run + env vars.
- [ ] Seed demo tenant + demo users.

```

```md
13-codex-execution-rules.md
# Codex / AI-agents execution rules (промпты, стиль, quality bar)

## Executive summary

Цель: работать как «команда» агентов. Каждый агент читает релевантные md файлы и генерирует код/тесты/дизайн. Quality bar высокий: production-level код, тесты обязательны.

## Deliverables
- набор стандартных промптов по ролям
- правила PR/commit/review
- definition of done
- порядок разработки

## Общие правила для всех агентов
- Всегда начинать с чтения файлов:
  - 01 (PRD), 02 (архитектура), 03 (домен), 04 (form engine), 05 (API), 06 (UX), 09 (a11y), 10 (security), 11 (tests)
- Никаких «заглушек» без TODO-ticket.
- Каждая фича включает:
  - код
  - тесты
  - типы
  - документацию (минимум комментарии/README)
- Никаких `any` в TypeScript без крайней необходимости.
- Все изменения проходят lint/typecheck/tests.

## Правила веток/коммитов
- branch: feature/<scope>-<short>
- commits: Conventional Commits
  - feat:, fix:, chore:, test:, docs:
- PR должен содержать:
  - что сделано
  - как тестировать локально
  - ссылки на тесты (playwright report)

## PR review checklist
- [ ] multi-tenant checks есть на backend routes
- [ ] validation на backend не слабее frontend
- [ ] audit log пишется при staff edits
- [ ] a11y: компоненты имеют label/aria
- [ ] i18n: строки не хардкожены
- [ ] security: нет утечки secrets/PII в логах
- [ ] tests покрывают критический сценарий

## Агент: Frontend Dev (Kundenportal wizard)
### Prompt template
"Ты — senior frontend engineer. Реализуй страницу wizard {pageKey} по 04-form-engine-spec.md и 06-ux-ui-guidelines.md.
Требования:
- react-hook-form + zod resolver
- required/soft_required semantics
- conditional visibility
- page-level error summary + field-level errors
- a11y: labels, aria-live, keyboard, focus
- i18n (next-intl): все тексты через ключи
- theming через CSS variables из tenant theme
- autosave при Next/Prev через API 05.
Покрой компонентными тестами и e2e тестом.
Сгенерируй код, тесты, и обнови маршрутизацию stepper."

## Агент: Backend Dev (Applications API)
### Prompt template
"Ты — senior backend engineer. Реализуй endpoints:
- POST /api/public/forms/{formId}/applications:draft
- PUT /api/public/applications/{id}/pages/{pageKey}
- POST /api/public/applications/{id}:submit
Соблюдай:
- multi-tenant isolation
- validation по effective schema (base+override)
- audit trail для staff edits (где применимо)
- outbox events (email/pdf)
- rate limiting на auth
Добавь integration tests (supertest) и миграции БД."

## Агент: QA
### Prompt template
"Ты — QA automation engineer. На базе 11-testing-strategy.md напиши Playwright suite:
- flow A, B, C, D, E
Добавь axe checks.
Настрой отчеты и CI integration."

## Агент: DevOps
### Prompt template
"Ты — DevOps engineer. Настрой:
- docker-compose (local)
- GitHub Actions pipeline (lint/typecheck/test/e2e/build/deploy)
- AWS ECS/RDS/S3/SES infra (Terraform желательно)
Секреты через GitHub Environments + AWS Secrets Manager."

## Агент: Designer
### Prompt template
"Ты — product designer. Собери UI kit и макеты:
- Kundenportal wizard pages (antragsdetails, anschlussort, kontaktdaten, technische daten, consent, summary, final)
- Backoffice list/detail/edit
Соблюдай accessibility и theming.
Отдай: Figma components + спецификацию токенов (цвета/типографика/spacing) + states (error/warn/disabled/focus)."

```

```md
14-implementation-roadmap.md
# Implementation roadmap (2–4 week iterations)

## Executive summary

Цель — не «идеальная архитектура», а быстрый, качественный demo-ready MVP, который без переделок масштабируется до production.

## Deliverables
- milestones
- sprint plan
- dependency graph
- demo-ready критерии

## Milestones (high level)

M0: Foundation
- monorepo + CI
- db migrations
- auth base
- tenant config + demo tenant

M1: Kundenportal core
- form schema runtime render (MVP subset)
- draft creation + autosave pages
- required/soft_required UI

M2: Submit + emails + credentials + login
- consent step
- submit flow
- email outbox + SES integration
- customer login + resume

M3: Backoffice core
- staff login + RBAC
- list/detail
- edit mode + audit
- notifications bell

M4: PDF + export
- pdf worker + templates
- download in portal + backoffice
- CSV export

M5: A11y hardening + i18n + polish
- axe suite clean
- translations de/en/tr/es
- responsive/zoom QA

M6: OCR demo
- upload + OCR job + verify UI

## Sprint plan (пример: 3 спринта по 3 недели)

### Sprint 1 (Weeks 1–3): Foundation + Kundenportal skeleton
Deliverables:
- Docker compose (postgres)
- DB schema v1
- Public form fetch + tenant theme apply
- Wizard routing + stepper
- Page 1 (antragsdetails) + draft create endpoint
- Basic i18n scaffolding

Acceptance:
- draft создается
- required validation работает
- theme применяется

### Sprint 2 (Weeks 4–6): Full wizard + submit + customer login
Deliverables:
- остальные страницы wizard (anschlussort/kontaktdaten/technische daten/consent/summary/final)
- soft_required semantics
- submit + credential email outbox
- customer login/resume
- cleanup jobs (draft 2 days)

Acceptance:
- flow A проходит E2E
- emails отправляются (sandbox ok)
- incomplete -> complete работает

### Sprint 3 (Weeks 7–9): Backoffice + audit + PDF + exports + A11y
Deliverables:
- backoffice list/detail/edit/audit
- status transitions + appointment
- pdf worker + download
- CSV export
- a11y + visual regression
- retention incomplete 1 month

Acceptance:
- flow B/C/D/E проходят
- demo ready package

## Timeline (Mermaid)

~~~mermaid
timeline
  title MVP Roadmap (пример)
  Week 1-3 : Foundation + Kundenportal skeleton
  Week 4-6 : Full wizard + Submit + Customer login
  Week 7-9 : Backoffice + Audit + PDF + A11y
  Week 10 : OCR demo + polish + demo rehearsal
~~~

```

```md
15-open-decisions-and-recommendations.md
# Open decisions & recommendations

## Executive summary

Ниже — пункты, где входные требования неполны или потенциально рискованные. Мы принимаем «best practice» решения и помечаем как рекомендация.

## Open decisions (и решение)

### D1: Статусная модель (founder unsure)
Решение (рекомендация):
- использовать набор статусов из 03-domain-model...
Почему:
- покрывает draft/incomplete/complete/review/scheduled/in-progress/completed
- строго соблюдает блокировку обработки при missing soft_required

### D2: Отправка пароля по email (безопасность)
Требование: email содержит tracking+password.
Рекомендация реализации:
- отправлять временный пароль (TTL 24h)
- требовать смену пароля при первом входе
- rate limiting на login
Почему:
- email небезопасен канал, но requirement сохраняем.

### D3: Address autocomplete provider
Требование: «точный адрес» и автозаполнение.
Рекомендация:
- Demo/low volume: Nominatim с caching и соблюдением policy
- Production: Google Places (или self-hosted geocoder)
Почему:
- бесплатные публичные сервисы ограничены по policy

### D4: DB выбор (Mongo vs Postgres)
Рекомендация:
- один Postgres + JSONB
Почему:
- меньше инфраструктуры, проще multi-tenant и audit/exports

### D5: Form builder UI (admin) в MVP
Founder хочет «лучше сразу».
Рекомендация:
- MVP-light:
  - UI редактирования tenant theme JSON (валидированное)
  - UI редактирования override operations JSON (валидированное) + preview
- Полный визуальный drag&drop builder — post-MVP
Почему:
- иначе сильно рискуем сроками и качеством core workflow.

### D6: PDF «идеально как бумага»
Рекомендация:
- MVP: «очень похоже» (табличный layout, фиксированные блоки)
- Later: точное совпадение через отдельные template версии и layout tuning
Почему:
- абсолютное совпадение часто требует дизайнерской верстки под каждый бланк.

## Риски

- Soft_required semantics легко сломать «обработкой» — нужен строгий guard на backend (no transition if incomplete).
- Multi-tenant: риск IDOR — обязательны интеграционные тесты.
- A11y: риск «почти доступно» — нужен axe+manual QA.
- PDF generation: риск нестабильного рендера в docker — нужно фиксировать шрифты и chromium.

## Рекомендованный минимум «до демо»
- один tenant demo (P001)
- одна форма Hausanschluss с реальными страницами
- Bankdaten/SEPA форма
- backoffice list/detail/edit/audit
- PDF download
- emails
- a11y smoke passes

```

---

## Примерные промпты для Codex (запуск генерации)

### Prompt 1 — Frontend wizard page (Antragsdetails)

Скопируй и вставь в Codex:

> Ты — Senior Frontend Engineer. Прочитай файлы: 01-product-requirements.md, 04-form-engine-spec.md, 05-api-spec.md, 06-ux-ui-guidelines.md, 09-accessibility-compliance-spec.md.  
> Реализуй Kundenportal страницу wizard `antragsdetails` в Next.js (React):  
> - Рендер из effective schema JSON (base+override) для pageKey=antragsdetails.  
> - Поля: selectedMedia (checkbox group required), requestType (radio required), changeKind (select required если requestType=change_connection), wunschtermin (date required), message (textarea max 255 optional).  
> - Реализуй required/soft_required semantics: required блокирует Next; soft_required предупреждает modal и позволяет skip.  
> - Ошибки: page-level summary + field-level messages; aria-live.  
> - i18n: de/en/tr/es через next-intl; никаких строк хардкодом.  
> - Theming: применяй tenant theme CSS variables, logo в header.  
> - Autosave: при Next вызывай `POST /api/public/forms/{formId}/applications:draft` если applicationId отсутствует, иначе `PUT /api/public/applications/{id}/pages/antragsdetails`.  
> - Напиши component tests (React Testing Library) и E2E (Playwright) + axe check для этой страницы.  
> Выведи: изменения файлов, команды для запуска тестов, и краткое описание.

### Prompt 2 — Backend endpoint (create draft + page save)

Скопируй и вставь в Codex:

> Ты — Senior Backend Engineer. Прочитай файлы: 02-system-architecture.md, 03-domain-model-and-status-workflow.md, 04-form-engine-spec.md, 05-api-spec.md, 10-security-and-privacy-spec.md, 11-testing-strategy.md.  
> Реализуй endpoints в NestJS:  
> 1) `POST /api/public/forms/:formId/applications:draft`  
> 2) `PUT /api/public/applications/:applicationId/pages/:pageKey`  
> Требования:  
> - multi-tenant isolation: formId и applicationId всегда проверяются на принадлежность tenant.  
> - validation: построить effective schema (base template + tenant override), валидировать data по правилам (required/hard validation).  
> - soft_required не блокирует сохранение страницы, но возвращается в ответе `softMissing[]`.  
> - сохраняй page data в ApplicationPageData (jsonb) и обновляй Application.lastActivityAt.  
> - добавь интеграционные тесты supertest: happy path + cross-tenant denial + validation errors.  
> - добавь миграции БД.  
> Выведи: код контроллеров/сервисов, миграции, тесты, и инструкции запуска.

