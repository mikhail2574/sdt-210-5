import { z } from "zod";

import type { AntragsdetailsFormValues, Condition, ConditionGroup, FieldBlock, FormPage } from "@/lib/forms/types";

const valuesSchema = z.object({
  selectedMedia: z.array(z.string()).default([]),
  requestType: z.string().default(""),
  changeKind: z.string().default(""),
  wunschtermin: z.string().default(""),
  message: z.string().default("")
});

export type ValidationErrorMap = Partial<Record<keyof AntragsdetailsFormValues, string>>;

function hasText(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value.trim().length > 0;
}

function getValueByPath(values: AntragsdetailsFormValues, path: string) {
  const normalized = path.replace(/^antragsdetails\./, "") as keyof AntragsdetailsFormValues;
  return values[normalized];
}

function evaluateCondition(condition: Condition, values: AntragsdetailsFormValues) {
  const currentValue = getValueByPath(values, condition.path);

  if (condition.op === "equals") {
    return currentValue === condition.value;
  }

  if (condition.op === "contains") {
    return Array.isArray(currentValue) && currentValue.includes(condition.value);
  }

  return false;
}

export function isFieldVisible(field: FieldBlock, values: AntragsdetailsFormValues) {
  if (!field.visibleWhen) {
    return true;
  }

  return evaluateGroup(field.visibleWhen, values);
}

function evaluateGroup(group: ConditionGroup, values: AntragsdetailsFormValues) {
  if (group.all) {
    return group.all.every((condition) => evaluateCondition(condition, values));
  }

  if (group.any) {
    return group.any.some((condition) => evaluateCondition(condition, values));
  }

  return true;
}

function getFieldValue(values: AntragsdetailsFormValues, fieldId: keyof AntragsdetailsFormValues) {
  return values[fieldId];
}

export function normalizeValues(values: Partial<AntragsdetailsFormValues>) {
  return valuesSchema.parse(values);
}

export function buildAntragsdetailsSchema(page: FormPage) {
  return valuesSchema.superRefine((values, context) => {
    for (const section of page.sections) {
      for (const block of section.blocks) {
        if (block.type !== "field" || !isFieldVisible(block, values)) {
          continue;
        }

        const fieldId = block.id as keyof AntragsdetailsFormValues;
        const value = values[fieldId];

        if (block.requirement === "required" && !hasText(value)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `errors.${fieldId}.required`,
            path: [fieldId]
          });
        }

        if (block.id === "wunschtermin" && hasText(value)) {
          const parsedDate = Date.parse(value as string);

          if (Number.isNaN(parsedDate)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "errors.wunschtermin.invalid",
              path: ["wunschtermin"]
            });
          }
        }

        if (block.id === "message" && typeof value === "string" && block.validation?.maxLength && value.length > block.validation.maxLength) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "errors.message.maxLength",
            path: ["message"]
          });
        }
      }
    }
  });
}

export function validateRequiredFields(page: FormPage, rawValues: Partial<AntragsdetailsFormValues>) {
  const values = normalizeValues(rawValues);
  const errors: ValidationErrorMap = {};

  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.type !== "field") {
        continue;
      }

      if (!isFieldVisible(block, values)) {
        continue;
      }

      const fieldId = block.id as keyof AntragsdetailsFormValues;
      const value = getFieldValue(values, fieldId);

      if (block.requirement === "required" && !hasText(value)) {
        errors[fieldId] = `errors.${fieldId}.required`;
        continue;
      }

      if (block.id === "wunschtermin" && hasText(value)) {
        const parsedDate = Date.parse(value as string);

        if (Number.isNaN(parsedDate)) {
          errors.wunschtermin = "errors.wunschtermin.invalid";
        }
      }

      if (block.id === "message" && typeof value === "string" && block.validation?.maxLength && value.length > block.validation.maxLength) {
        errors.message = "errors.message.maxLength";
      }
    }
  }

  return { values, errors };
}

export function getSoftMissingFields(page: FormPage, rawValues: Partial<AntragsdetailsFormValues>) {
  const values = normalizeValues(rawValues);
  const softMissing: FieldBlock[] = [];

  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.type !== "field") {
        continue;
      }

      if (block.requirement !== "soft_required" || !isFieldVisible(block, values)) {
        continue;
      }

      const fieldId = block.id as keyof AntragsdetailsFormValues;
      const value = getFieldValue(values, fieldId);

      if (!hasText(value)) {
        softMissing.push(block);
      }
    }
  }

  return softMissing;
}
