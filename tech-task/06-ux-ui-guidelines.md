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
