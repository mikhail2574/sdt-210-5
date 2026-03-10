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
