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
