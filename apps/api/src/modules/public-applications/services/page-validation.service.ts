import { Injectable } from "@nestjs/common";

import { type Condition, type ConditionGroup, type FieldBlock, type FormPage, type PageValidationResult, type ValidationIssue } from "../form-schema.types";

@Injectable()
export class PageValidationService {
  validatePage(page: FormPage, data: Record<string, unknown>): PageValidationResult {
    const hardMissing: ValidationIssue[] = [];
    const softMissing: string[] = [];

    for (const section of page.sections) {
      for (const block of section.blocks) {
        if (block.type !== "field") {
          continue;
        }

        if (!this.isVisible(block, data, page.key)) {
          continue;
        }

        const value = this.getValue(block, data, page.key);

        if (block.requirement === "required" && !this.hasValue(value)) {
          hardMissing.push({ path: block.bind.path, issue: "required" });
          continue;
        }

        if (block.requirement === "soft_required" && !this.hasValue(value)) {
          softMissing.push(block.bind.path);
          continue;
        }

        if (!this.hasValue(value)) {
          continue;
        }

        this.validateValue(block, value, hardMissing);
      }
    }

    return { hardMissing, softMissing };
  }

  private validateValue(field: FieldBlock, value: unknown, hardMissing: ValidationIssue[]) {
    if (field.fieldType === "checkbox_group") {
      if (!Array.isArray(value)) {
        hardMissing.push({ path: field.bind.path, issue: "invalid_type" });
        return;
      }

      if (field.validation?.minItems && value.length < field.validation.minItems) {
        hardMissing.push({ path: field.bind.path, issue: "min_items" });
      }

      if (field.validation?.maxItems && value.length > field.validation.maxItems) {
        hardMissing.push({ path: field.bind.path, issue: "max_items" });
      }

      if (field.options && value.some((item) => typeof item !== "string" || !field.options?.some((option) => option.id === item))) {
        hardMissing.push({ path: field.bind.path, issue: "invalid_option" });
      }

      return;
    }

    if (field.fieldType === "radio_group" || field.fieldType === "select") {
      if (typeof value !== "string") {
        hardMissing.push({ path: field.bind.path, issue: "invalid_type" });
        return;
      }

      if (field.options && !field.options.some((option) => option.id === value)) {
        hardMissing.push({ path: field.bind.path, issue: "invalid_option" });
      }

      return;
    }

    if (field.fieldType === "date") {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        hardMissing.push({ path: field.bind.path, issue: "invalid_date" });
      }

      return;
    }

    if (field.fieldType === "textarea" || field.fieldType === "text") {
      if (typeof value !== "string") {
        hardMissing.push({ path: field.bind.path, issue: "invalid_type" });
        return;
      }

      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        hardMissing.push({ path: field.bind.path, issue: "max_length" });
      }
    }
  }

  private isVisible(field: FieldBlock, data: Record<string, unknown>, pageKey: string) {
    if (!field.visibleWhen) {
      return true;
    }

    return this.evaluateGroup(field.visibleWhen, data, pageKey);
  }

  private evaluateGroup(group: ConditionGroup, data: Record<string, unknown>, pageKey: string) {
    if (group.all) {
      return group.all.every((condition) => this.evaluateCondition(condition, data, pageKey));
    }

    if (group.any) {
      return group.any.some((condition) => this.evaluateCondition(condition, data, pageKey));
    }

    return true;
  }

  private evaluateCondition(condition: Condition, data: Record<string, unknown>, pageKey: string) {
    const value = this.getValueByPath(condition.path, data, pageKey);

    if (condition.op === "equals") {
      return value === condition.value;
    }

    if (condition.op === "contains") {
      return Array.isArray(value) && value.includes(condition.value);
    }

    return false;
  }

  private getValue(field: FieldBlock, data: Record<string, unknown>, pageKey: string) {
    if (field.id in data) {
      return data[field.id];
    }

    return this.getValueByPath(field.bind.path, data, pageKey);
  }

  private getValueByPath(path: string, data: Record<string, unknown>, pageKey: string) {
    const normalizedPath = path.startsWith(`${pageKey}.`) ? path.slice(pageKey.length + 1) : path;
    const parts = normalizedPath.split(".");
    let current: unknown = data;

    for (const part of parts) {
      if (typeof current !== "object" || current === null || !(part in current)) {
        return undefined;
      }

      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private hasValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return value !== undefined && value !== null;
  }
}
