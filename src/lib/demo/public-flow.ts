export const publicWizardPageOrder = [
  "antragsdetails",
  "anschlussort",
  "kontaktdaten",
  "technische-daten",
  "rechtliche-hinweise",
  "uebersicht",
  "final"
] as const;

export type PublicWizardPageKey = (typeof publicWizardPageOrder)[number];

export type MissingItem = {
  pageKey: string;
  fieldPath: string;
  labelKey: string;
  messageKey?: string;
  kind: "field" | "attachment";
};

type PublicFieldSpec = {
  fieldPath: string;
  labelKey: string;
  requirement: "required" | "soft_required";
  kind?: "string" | "string[]" | "boolean" | "attachment";
  when?: (pages: Record<string, Record<string, unknown>>) => boolean;
  validate?: (pages: Record<string, Record<string, unknown>>) => string | null;
};

const pageSpecs: Record<string, PublicFieldSpec[]> = {
  antragsdetails: [
    {
      fieldPath: "antragsdetails.selectedMedia",
      labelKey: "fields.selectedMedia.label",
      requirement: "required",
      kind: "string[]"
    },
    {
      fieldPath: "antragsdetails.requestType",
      labelKey: "fields.requestType.label",
      requirement: "required"
    },
    {
      fieldPath: "antragsdetails.changeKind",
      labelKey: "fields.changeKind.label",
      requirement: "required",
      when: (pages) => getStringValue(pages, "antragsdetails.requestType") === "change_connection"
    },
    {
      fieldPath: "antragsdetails.wunschtermin",
      labelKey: "fields.wunschtermin.label",
      requirement: "required",
      validate: (pages) => {
        const value = getStringValue(pages, "antragsdetails.wunschtermin");
        return value.length > 0 && Number.isNaN(Date.parse(value)) ? "errors.wunschtermin.invalid" : null;
      }
    },
    {
      fieldPath: "antragsdetails.message",
      labelKey: "fields.message.label",
      requirement: "soft_required",
      validate: (pages) => {
        const value = getStringValue(pages, "antragsdetails.message");
        return value.length > 255 ? "errors.message.maxLength" : null;
      }
    }
  ],
  anschlussort: [
    {
      fieldPath: "anschlussort.postalCode",
      labelKey: "fields.postalCode.label",
      requirement: "required",
      when: (pages) => !getBooleanValue(pages, "anschlussort.addressUnknown")
    },
    {
      fieldPath: "anschlussort.city",
      labelKey: "fields.city.label",
      requirement: "required",
      when: (pages) => !getBooleanValue(pages, "anschlussort.addressUnknown")
    },
    {
      fieldPath: "anschlussort.street",
      labelKey: "fields.street.label",
      requirement: "required",
      when: (pages) => !getBooleanValue(pages, "anschlussort.addressUnknown")
    },
    {
      fieldPath: "anschlussort.houseNumber",
      labelKey: "fields.houseNumber.label",
      requirement: "required",
      when: (pages) => !getBooleanValue(pages, "anschlussort.addressUnknown")
    },
    {
      fieldPath: "anschlussort.district",
      labelKey: "fields.district.label",
      requirement: "required",
      when: (pages) => getBooleanValue(pages, "anschlussort.addressUnknown")
    },
    {
      fieldPath: "anschlussort.plot",
      labelKey: "fields.plot.label",
      requirement: "required",
      when: (pages) => getBooleanValue(pages, "anschlussort.addressUnknown")
    },
    {
      fieldPath: "anschlussort.objectType",
      labelKey: "fields.objectType.label",
      requirement: "required"
    },
    {
      fieldPath: "anschlussort.lageplanUploads",
      labelKey: "fields.lageplanUploads.label",
      requirement: "soft_required",
      kind: "attachment"
    }
  ],
  kontaktdaten: [
    {
      fieldPath: "kontaktdaten.salutation",
      labelKey: "fields.salutation.label",
      requirement: "required"
    },
    {
      fieldPath: "kontaktdaten.firstName",
      labelKey: "fields.firstName.label",
      requirement: "required"
    },
    {
      fieldPath: "kontaktdaten.lastName",
      labelKey: "fields.lastName.label",
      requirement: "required"
    },
    {
      fieldPath: "kontaktdaten.email",
      labelKey: "fields.email.label",
      requirement: "required",
      validate: (pages) => {
        const value = getStringValue(pages, "kontaktdaten.email");
        return value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "validation.invalidEmail" : null;
      }
    },
    {
      fieldPath: "kontaktdaten.confirmEmail",
      labelKey: "fields.confirmEmail.label",
      requirement: "required",
      validate: (pages) =>
        getStringValue(pages, "kontaktdaten.email") === getStringValue(pages, "kontaktdaten.confirmEmail")
          ? null
          : "errors.confirmEmail.mismatch"
    },
    {
      fieldPath: "kontaktdaten.phone",
      labelKey: "fields.phone.label",
      requirement: "soft_required"
    },
    {
      fieldPath: "kontaktdaten.technicalContactName",
      labelKey: "fields.technicalContactName.label",
      requirement: "soft_required",
      when: (pages) => !getBooleanValue(pages, "kontaktdaten.applicantIsTechnicalContact")
    }
  ],
  "technische-daten": [
    {
      fieldPath: "technische-daten.electricianMode",
      labelKey: "fields.electricianMode.label",
      requirement: "required"
    },
    {
      fieldPath: "technische-daten.connectionPowerKw",
      labelKey: "fields.connectionPowerKw.label",
      requirement: "required",
      validate: (pages) => {
        const value = getStringValue(pages, "technische-daten.connectionPowerKw");

        if (value.length === 0) {
          return null;
        }

        const parsed = Number(value);
        return Number.isNaN(parsed) || parsed <= 0 ? "validation.invalidNumber" : null;
      }
    },
    {
      fieldPath: "technische-daten.wallboxCount",
      labelKey: "fields.wallboxCount.label",
      requirement: "required",
      when: (pages) => getBooleanValue(pages, "technische-daten.hasWallbox"),
      validate: (pages) => {
        const value = getStringValue(pages, "technische-daten.wallboxCount");

        if (value.length === 0) {
          return null;
        }

        const parsed = Number(value);
        return Number.isNaN(parsed) || parsed <= 0 ? "validation.invalidNumber" : null;
      }
    },
    {
      fieldPath: "technische-daten.notes",
      labelKey: "fields.technicalNotes.label",
      requirement: "soft_required"
    }
  ],
  "rechtliche-hinweise": [
    {
      fieldPath: "rechtliche-hinweise.privacyPolicyAccepted",
      labelKey: "fields.privacyPolicyAccepted.label",
      requirement: "required",
      kind: "boolean"
    },
    {
      fieldPath: "rechtliche-hinweise.dataProcessingAccepted",
      labelKey: "fields.dataProcessingAccepted.label",
      requirement: "required",
      kind: "boolean"
    },
    {
      fieldPath: "rechtliche-hinweise.emailCommunicationAccepted",
      labelKey: "fields.emailCommunicationAccepted.label",
      requirement: "required",
      kind: "boolean"
    }
  ]
};

export function getNextWizardPageKey(pageKey: string) {
  const index = publicWizardPageOrder.findIndex((item) => item === pageKey);

  if (index === -1 || index === publicWizardPageOrder.length - 1) {
    return pageKey;
  }

  return publicWizardPageOrder[index + 1];
}

export function getPreviousWizardPageKey(pageKey: string) {
  const index = publicWizardPageOrder.findIndex((item) => item === pageKey);

  if (index <= 0) {
    return pageKey;
  }

  return publicWizardPageOrder[index - 1];
}

export function getValidationForPage(
  formId: string,
  pageKey: string,
  pages: Record<string, Record<string, unknown>>
) {
  const hardMissing: MissingItem[] = [];
  const softMissing: MissingItem[] = [];
  const specs = pageSpecs[pageKey] ?? [];

  for (const spec of specs) {
    if (spec.when && !spec.when(pages)) {
      continue;
    }

    const value = getValueByPath(pages, spec.fieldPath);

      if (spec.validate) {
        const errorKey = spec.validate(pages);

        if (errorKey) {
          hardMissing.push({
            pageKey,
            fieldPath: spec.fieldPath,
            labelKey: spec.labelKey,
            messageKey: errorKey,
            kind: spec.kind === "attachment" ? "attachment" : "field"
          });
          continue;
      }
    }

    const hasValue = hasFieldValue(value, spec.kind);
    const requirement = resolveRequirement(formId, spec);

    if (requirement === "required" && !hasValue) {
      hardMissing.push({
        pageKey,
        fieldPath: spec.fieldPath,
        labelKey: spec.labelKey,
        messageKey: spec.kind === "attachment" ? "validation.requiredAttachment" : "validation.requiredField",
        kind: spec.kind === "attachment" ? "attachment" : "field"
      });
    }

    if (requirement === "soft_required" && !hasValue) {
      softMissing.push({
        pageKey,
        fieldPath: spec.fieldPath,
        labelKey: spec.labelKey,
        kind: spec.kind === "attachment" ? "attachment" : "field"
      });
    }
  }

  return { hardMissing, softMissing };
}

export function getAggregatedMissingSummary(
  formId: string,
  pages: Record<string, Record<string, unknown>>
) {
  const hard: MissingItem[] = [];
  const soft: MissingItem[] = [];
  const attachments: MissingItem[] = [];

  for (const pageKey of publicWizardPageOrder) {
    if (pageKey === "uebersicht" || pageKey === "final") {
      continue;
    }

    const result = getValidationForPage(formId, pageKey, pages);
    hard.push(...result.hardMissing);

    for (const missing of result.softMissing) {
      if (missing.kind === "attachment") {
        attachments.push(missing);
      } else {
        soft.push(missing);
      }
    }
  }

  return { hard, soft, attachments };
}

function resolveRequirement(formId: string, spec: PublicFieldSpec) {
  if (formId === "hausanschluss-soft-demo" && spec.fieldPath === "antragsdetails.message") {
    return "soft_required";
  }

  if (formId !== "hausanschluss-soft-demo" && spec.fieldPath === "antragsdetails.message") {
    return "optional";
  }

  return spec.requirement;
}

function hasFieldValue(value: unknown, kind: PublicFieldSpec["kind"] = "string") {
  if (kind === "boolean") {
    return value === true;
  }

  if (kind === "string[]") {
    return Array.isArray(value) && value.length > 0;
  }

  if (kind === "attachment") {
    return Array.isArray(value) && value.length > 0;
  }

  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function getValueByPath(pages: Record<string, Record<string, unknown>>, fieldPath: string) {
  const [pageKey, ...pathParts] = fieldPath.split(".");
  let current: unknown = pages[pageKey] ?? {};

  for (const part of pathParts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function getStringValue(pages: Record<string, Record<string, unknown>>, fieldPath: string) {
  const value = getValueByPath(pages, fieldPath);
  return typeof value === "string" ? value : "";
}

function getBooleanValue(pages: Record<string, Record<string, unknown>>, fieldPath: string) {
  return getValueByPath(pages, fieldPath) === true;
}
