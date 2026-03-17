import {
  type FieldBlock,
  type FormOverrideOperation,
  type FormPage,
  type FormRuntime,
  type FormSchema
} from "@/lib/forms/types";
import { baseSchema, baseTheme, defaultOverridesByFormId } from "@/lib/forms/runtime-data";

function cloneSchema(schema: FormSchema): FormSchema {
  return JSON.parse(JSON.stringify(schema)) as FormSchema;
}

function getField(page: FormPage, fieldId: string): FieldBlock | null {
  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.type === "field" && block.id === fieldId) {
        return block;
      }
    }
  }

  return null;
}

export function applyOverrides(schema: FormSchema, operations: FormOverrideOperation[]): FormSchema {
  const nextSchema = cloneSchema(schema);

  for (const operation of operations) {
    const page = nextSchema.form.pages.find((pageItem) => pageItem.key === operation.target.pageKey);

    if (!page) {
      continue;
    }

    const field = getField(page, operation.target.fieldId);

    if (!field) {
      continue;
    }

    if (operation.op === "updateField") {
      Object.assign(field, operation.value);
    }

    if (operation.op === "updateRequirement") {
      field.requirement = operation.value;
    }
  }

  return nextSchema;
}

export function getFormRuntime(formId: string): FormRuntime {
  const overrides = defaultOverridesByFormId[formId] ?? defaultOverridesByFormId["hausanschluss-demo"];

  return {
    formId,
    tenantId: "local-form-preview",
    theme: baseTheme,
    schema: applyOverrides(baseSchema, overrides)
  };
}

export function getPageSchema(formId: string, pageKey: string) {
  return getFormRuntime(formId).schema.form.pages.find((page) => page.key === pageKey) ?? null;
}
