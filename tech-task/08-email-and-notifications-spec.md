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
