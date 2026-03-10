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
