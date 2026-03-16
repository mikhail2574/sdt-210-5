import type { Requirement, ThemeConfig } from "@/lib/forms/types";
import { publicWizardPageOrder, type PublicWizardPageKey } from "@/lib/demo/public-flow";

export type WizardPageValues = Record<string, unknown>;

export type WizardFieldOption = {
  value: string;
  labelKey: string;
};

export type WizardFieldConfig = {
  id: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio_group" | "checkbox" | "checkbox_group" | "date" | "file_list";
  labelKey: string;
  helpKey?: string;
  placeholderKey?: string;
  requirement: Requirement;
  options?: WizardFieldOption[];
  rows?: number;
  visibleWhen?: (values: WizardPageValues) => boolean;
};

export type WizardSectionConfig = {
  key: string;
  titleKey: string;
  infoKey?: string;
  fields: WizardFieldConfig[];
};

export type WizardPageConfig = {
  key: PublicWizardPageKey;
  titleKey: string;
  descriptionKey: string;
  sections: WizardSectionConfig[];
};

export const wizardPageConfigs: Record<PublicWizardPageKey, WizardPageConfig> = {
  antragsdetails: {
    key: "antragsdetails",
    titleKey: "pages.antragsdetails.title",
    descriptionKey: "pages.antragsdetails.description",
    sections: []
  },
  anschlussort: {
    key: "anschlussort",
    titleKey: "pages.anschlussort.title",
    descriptionKey: "pages.anschlussort.description",
    sections: [
      {
        key: "adresse",
        titleKey: "sections.address.title",
        infoKey: "pages.anschlussort.info",
        fields: [
          {
            id: "addressUnknown",
            type: "checkbox",
            labelKey: "fields.addressUnknown.label",
            helpKey: "fields.addressUnknown.help",
            requirement: "optional"
          },
          {
            id: "postalCode",
            type: "text",
            labelKey: "fields.postalCode.label",
            requirement: "required",
            visibleWhen: (values) => values.addressUnknown !== true
          },
          {
            id: "city",
            type: "text",
            labelKey: "fields.city.label",
            requirement: "required",
            visibleWhen: (values) => values.addressUnknown !== true
          },
          {
            id: "street",
            type: "text",
            labelKey: "fields.street.label",
            requirement: "required",
            visibleWhen: (values) => values.addressUnknown !== true
          },
          {
            id: "houseNumber",
            type: "text",
            labelKey: "fields.houseNumber.label",
            requirement: "required",
            visibleWhen: (values) => values.addressUnknown !== true
          },
          {
            id: "district",
            type: "text",
            labelKey: "fields.district.label",
            requirement: "required",
            visibleWhen: (values) => values.addressUnknown === true
          },
          {
            id: "plot",
            type: "text",
            labelKey: "fields.plot.label",
            requirement: "required",
            visibleWhen: (values) => values.addressUnknown === true
          }
        ]
      },
      {
        key: "objekt",
        titleKey: "sections.object.title",
        fields: [
          {
            id: "objectType",
            type: "select",
            labelKey: "fields.objectType.label",
            requirement: "required",
            options: [
              { value: "gebaeude", labelKey: "options.objectType.gebaeude" },
              { value: "freiflaeche", labelKey: "options.objectType.freiflaeche" },
              { value: "sonstiges", labelKey: "options.objectType.sonstiges" }
            ]
          },
          {
            id: "usageType",
            type: "select",
            labelKey: "fields.usageType.label",
            helpKey: "fields.usageType.help",
            requirement: "optional",
            options: [
              { value: "einfamilienhaus", labelKey: "options.usageType.einfamilienhaus" },
              { value: "mehrfamilienhaus", labelKey: "options.usageType.mehrfamilienhaus" },
              { value: "gewerbe", labelKey: "options.usageType.gewerbe" }
            ]
          }
        ]
      },
      {
        key: "uploads",
        titleKey: "sections.uploads.title",
        fields: [
          {
            id: "lageplanUploads",
            type: "file_list",
            labelKey: "fields.lageplanUploads.label",
            helpKey: "fields.lageplanUploads.help",
            requirement: "soft_required"
          }
        ]
      }
    ]
  },
  kontaktdaten: {
    key: "kontaktdaten",
    titleKey: "pages.kontaktdaten.title",
    descriptionKey: "pages.kontaktdaten.description",
    sections: [
      {
        key: "applicant",
        titleKey: "sections.applicant.title",
        infoKey: "pages.kontaktdaten.info",
        fields: [
          {
            id: "salutation",
            type: "select",
            labelKey: "fields.salutation.label",
            requirement: "required",
            options: [
              { value: "frau", labelKey: "options.salutation.frau" },
              { value: "herr", labelKey: "options.salutation.herr" },
              { value: "divers", labelKey: "options.salutation.divers" }
            ]
          },
          {
            id: "firstName",
            type: "text",
            labelKey: "fields.firstName.label",
            requirement: "required"
          },
          {
            id: "lastName",
            type: "text",
            labelKey: "fields.lastName.label",
            requirement: "required"
          },
          {
            id: "email",
            type: "email",
            labelKey: "fields.email.label",
            requirement: "required"
          },
          {
            id: "confirmEmail",
            type: "email",
            labelKey: "fields.confirmEmail.label",
            requirement: "required"
          },
          {
            id: "phone",
            type: "tel",
            labelKey: "fields.phone.label",
            requirement: "soft_required"
          }
        ]
      },
      {
        key: "technical",
        titleKey: "sections.technicalContact.title",
        fields: [
          {
            id: "applicantIsTechnicalContact",
            type: "checkbox",
            labelKey: "fields.applicantIsTechnicalContact.label",
            helpKey: "fields.applicantIsTechnicalContact.help",
            requirement: "optional"
          },
          {
            id: "technicalContactName",
            type: "text",
            labelKey: "fields.technicalContactName.label",
            helpKey: "fields.technicalContactName.help",
            requirement: "soft_required",
            visibleWhen: (values) => values.applicantIsTechnicalContact !== true
          }
        ]
      }
    ]
  },
  "technische-daten": {
    key: "technische-daten",
    titleKey: "pages.technischeDaten.title",
    descriptionKey: "pages.technischeDaten.description",
    sections: [
      {
        key: "strom",
        titleKey: "sections.energy.title",
        infoKey: "pages.technischeDaten.info",
        fields: [
          {
            id: "electricianMode",
            type: "radio_group",
            labelKey: "fields.electricianMode.label",
            requirement: "required",
            options: [
              { value: "registered", labelKey: "options.electricianMode.registered" },
              { value: "guest", labelKey: "options.electricianMode.guest" },
              { value: "unknown", labelKey: "options.electricianMode.unknown" }
            ]
          },
          {
            id: "connectionPowerKw",
            type: "number",
            labelKey: "fields.connectionPowerKw.label",
            helpKey: "fields.connectionPowerKw.help",
            requirement: "required"
          },
          {
            id: "hasWallbox",
            type: "checkbox",
            labelKey: "fields.hasWallbox.label",
            requirement: "optional"
          },
          {
            id: "wallboxCount",
            type: "number",
            labelKey: "fields.wallboxCount.label",
            requirement: "required",
            visibleWhen: (values) => values.hasWallbox === true
          },
          {
            id: "hasPv",
            type: "checkbox",
            labelKey: "fields.hasPv.label",
            requirement: "optional"
          },
          {
            id: "notes",
            type: "textarea",
            labelKey: "fields.technicalNotes.label",
            helpKey: "fields.technicalNotes.help",
            requirement: "soft_required",
            rows: 5
          }
        ]
      }
    ]
  },
  "rechtliche-hinweise": {
    key: "rechtliche-hinweise",
    titleKey: "pages.rechtlicheHinweise.title",
    descriptionKey: "pages.rechtlicheHinweise.description",
    sections: [
      {
        key: "consents",
        titleKey: "sections.consents.title",
        infoKey: "pages.rechtlicheHinweise.info",
        fields: [
          {
            id: "privacyPolicyAccepted",
            type: "checkbox",
            labelKey: "fields.privacyPolicyAccepted.label",
            helpKey: "fields.privacyPolicyAccepted.help",
            requirement: "required"
          },
          {
            id: "dataProcessingAccepted",
            type: "checkbox",
            labelKey: "fields.dataProcessingAccepted.label",
            helpKey: "fields.dataProcessingAccepted.help",
            requirement: "required"
          },
          {
            id: "emailCommunicationAccepted",
            type: "checkbox",
            labelKey: "fields.emailCommunicationAccepted.label",
            helpKey: "fields.emailCommunicationAccepted.help",
            requirement: "required"
          }
        ]
      }
    ]
  },
  uebersicht: {
    key: "uebersicht",
    titleKey: "pages.uebersicht.title",
    descriptionKey: "pages.uebersicht.description",
    sections: []
  },
  final: {
    key: "final",
    titleKey: "pages.final.title",
    descriptionKey: "pages.final.description",
    sections: []
  }
};

export function getWizardPageConfig(pageKey: PublicWizardPageKey) {
  return wizardPageConfigs[pageKey];
}

export function getWizardDefaultValues(pageKey: PublicWizardPageKey, initialValues: WizardPageValues = {}) {
  const config = getWizardPageConfig(pageKey);
  const result: WizardPageValues = {};

  for (const section of config.sections) {
    for (const field of section.fields) {
      if (field.type === "checkbox") {
        result[field.id] = initialValues[field.id] === true;
        continue;
      }

      if (field.type === "checkbox_group" || field.type === "file_list") {
        result[field.id] = Array.isArray(initialValues[field.id]) ? initialValues[field.id] : [];
        continue;
      }

      result[field.id] = typeof initialValues[field.id] === "string" ? initialValues[field.id] : "";
    }
  }

  return result;
}

export function isWizardFieldVisible(field: WizardFieldConfig, values: WizardPageValues) {
  return field.visibleWhen ? field.visibleWhen(values) : true;
}

export function hasWizardValue(field: WizardFieldConfig, value: unknown) {
  if (field.type === "checkbox") {
    return value === true;
  }

  if (field.type === "checkbox_group" || field.type === "file_list") {
    return Array.isArray(value) && value.length > 0;
  }

  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

export function getSoftMissingWizardFields(pageKey: PublicWizardPageKey, values: WizardPageValues) {
  const config = getWizardPageConfig(pageKey);

  return config.sections.flatMap((section) =>
    section.fields.filter(
      (field) =>
        field.requirement === "soft_required" &&
        isWizardFieldVisible(field, values) &&
        !hasWizardValue(field, values[field.id])
    )
  );
}

export function getWizardStepTitleKeys() {
  return publicWizardPageOrder.map((pageKey) => ({
    pageKey,
    titleKey: wizardPageConfigs[pageKey].titleKey
  }));
}

export function getPortalTheme(theme: ThemeConfig) {
  return theme;
}
