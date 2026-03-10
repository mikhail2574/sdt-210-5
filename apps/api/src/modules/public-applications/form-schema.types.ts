export type Requirement = "optional" | "required" | "soft_required";

export type Condition =
  | {
      path: string;
      op: "equals";
      value: string;
    }
  | {
      path: string;
      op: "contains";
      value: string;
    };

export type ConditionGroup = {
  all?: Condition[];
  any?: Condition[];
};

export type FieldOption = {
  id: string;
  labelI18nKey: string;
};

export type FieldBlock = {
  type: "field";
  id: string;
  fieldType: "checkbox_group" | "radio_group" | "select" | "date" | "textarea" | "text";
  bind: {
    path: string;
  };
  requirement: Requirement;
  labelI18nKey?: string;
  options?: FieldOption[];
  visibleWhen?: ConditionGroup;
  validation?: {
    minItems?: number;
    maxItems?: number;
    maxLength?: number;
  };
};

export type InfoBlock = {
  type: "info";
  id: string;
  contentI18nKey: string;
};

export type PageBlock = FieldBlock | InfoBlock;

export type FormSection = {
  key: string;
  titleI18nKey: string;
  blocks: PageBlock[];
};

export type FormPage = {
  key: string;
  order: number;
  titleI18nKey: string;
  sections: FormSection[];
};

export type FormSchema = {
  form: {
    key: string;
    titleI18nKey: string;
    descriptionI18nKey?: string;
    pages: FormPage[];
  };
};

export type FormOverrideOperation =
  | {
      op: "updateRequirement";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: Requirement;
    }
  | {
      op: "updateField";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: Partial<FieldBlock>;
    }
  | {
      op: "updateValidation";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: FieldBlock["validation"];
    }
  | {
      op: "updateVisibility";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: ConditionGroup;
    }
  | {
      op: "updateOptions";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: FieldOption[];
    };

export type ValidationIssue = {
  path: string;
  issue: string;
};

export type PageValidationResult = {
  hardMissing: ValidationIssue[];
  softMissing: string[];
};
