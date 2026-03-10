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
