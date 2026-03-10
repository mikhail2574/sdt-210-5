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
