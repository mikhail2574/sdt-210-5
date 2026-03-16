import type { FormOverrideOperation, FormSchema, ThemeConfig } from "@/lib/forms/types";

export const baseTheme: ThemeConfig = {
  tenantCode: "P001",
  logo: {
    url: "/logo.svg",
    altI18nKey: "theme.logoAlt"
  },
  palette: {
    primary: "#0057B8",
    secondary: "#00356F",
    accent: "#F6A313",
    bg: "#F6F8FB",
    text: "#10213A",
    danger: "#B32020",
    warning: "#8A5A00"
  },
  typography: {
    fontFamily: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
    baseFontSizePx: 16
  }
};

export const baseSchema: FormSchema = {
  form: {
    key: "hausanschluss",
    version: 1,
    titleI18nKey: "forms.hausanschluss.title",
    descriptionI18nKey: "forms.hausanschluss.description",
    pages: [
      {
        key: "antragsdetails",
        titleI18nKey: "pages.antragsdetails.title",
        order: 10,
        softRequiredLeaveWarningI18nKey: "wizard.softRequired.leaveWarning",
        sections: [
          {
            key: "medium",
            titleI18nKey: "sections.medium.title",
            blocks: [
              {
                type: "info",
                id: "info_project",
                contentI18nKey: "pages.antragsdetails.info"
              },
              {
                type: "field",
                id: "selectedMedia",
                fieldType: "checkbox_group",
                bind: { path: "antragsdetails.selectedMedia" },
                labelI18nKey: "fields.selectedMedia.label",
                requirement: "required",
                options: [
                  { id: "strom", labelI18nKey: "media.strom" },
                  { id: "gas", labelI18nKey: "media.gas" },
                  { id: "wasser", labelI18nKey: "media.wasser" }
                ],
                validation: {
                  minItems: 1,
                  maxItems: 3
                }
              }
            ]
          },
          {
            key: "antragsart",
            titleI18nKey: "sections.antragsart.title",
            blocks: [
              {
                type: "field",
                id: "requestType",
                fieldType: "radio_group",
                bind: { path: "antragsdetails.requestType" },
                labelI18nKey: "fields.requestType.label",
                requirement: "required",
                options: [
                  { id: "new_connection", labelI18nKey: "requestType.new" },
                  { id: "change_connection", labelI18nKey: "requestType.change" },
                  { id: "stilllegung", labelI18nKey: "requestType.stilllegung" }
                ]
              },
              {
                type: "field",
                id: "changeKind",
                fieldType: "select",
                bind: { path: "antragsdetails.changeKind" },
                labelI18nKey: "fields.changeKind.label",
                helpTextI18nKey: "fields.changeKind.help",
                requirement: "required",
                visibleWhen: {
                  all: [
                    {
                      path: "antragsdetails.requestType",
                      op: "equals",
                      value: "change_connection"
                    }
                  ]
                },
                options: [
                  { id: "anlagen_erweiterung", labelI18nKey: "changeKind.erweiterung" },
                  { id: "zusammenlegung", labelI18nKey: "changeKind.zusammenlegung" }
                ]
              }
            ]
          },
          {
            key: "planung",
            titleI18nKey: "sections.planung.title",
            blocks: [
              {
                type: "field",
                id: "wunschtermin",
                fieldType: "date",
                bind: { path: "antragsdetails.wunschtermin" },
                labelI18nKey: "fields.wunschtermin.label",
                helpTextI18nKey: "fields.wunschtermin.help",
                requirement: "required"
              },
              {
                type: "field",
                id: "message",
                fieldType: "textarea",
                bind: { path: "antragsdetails.message" },
                labelI18nKey: "fields.message.label",
                helpTextI18nKey: "fields.message.help",
                requirement: "optional",
                validation: {
                  maxLength: 255
                },
                ui: {
                  rows: 5
                }
              }
            ]
          }
        ]
      }
    ]
  }
};

export const defaultOverridesByFormId: Record<string, FormOverrideOperation[]> = {
  "hausanschluss-demo": [
    {
      op: "updateField",
      target: { pageKey: "antragsdetails", fieldId: "message" },
      value: {
        helpTextI18nKey: "fields.message.helpWithHint"
      }
    }
  ],
  "hausanschluss-soft-demo": [
    {
      op: "updateRequirement",
      target: { pageKey: "antragsdetails", fieldId: "message" },
      value: "soft_required"
    }
  ]
};
