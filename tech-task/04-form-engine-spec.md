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
