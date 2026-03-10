export type Requirement = "optional" | "required" | "soft_required";

export type FieldType = "checkbox_group" | "radio_group" | "select" | "date" | "textarea";

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

export type InfoBlock = {
  type: "info";
  id: string;
  contentI18nKey: string;
};

export type FieldBlock = {
  type: "field";
  id: string;
  fieldType: FieldType;
  bind: {
    path: string;
  };
  labelI18nKey: string;
  requirement: Requirement;
  helpTextI18nKey?: string;
  options?: FieldOption[];
  visibleWhen?: ConditionGroup;
  validation?: {
    minItems?: number;
    maxItems?: number;
    maxLength?: number;
  };
  ui?: {
    rows?: number;
  };
};

export type PageBlock = InfoBlock | FieldBlock;

export type FormSection = {
  key: string;
  titleI18nKey: string;
  blocks: PageBlock[];
};

export type FormPage = {
  key: string;
  titleI18nKey: string;
  order: number;
  softRequiredLeaveWarningI18nKey: string;
  sections: FormSection[];
};

export type FormSchema = {
  form: {
    key: string;
    version: number;
    titleI18nKey: string;
    descriptionI18nKey: string;
    pages: FormPage[];
  };
};

export type FormOverrideOperation =
  | {
      op: "updateField";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: Partial<FieldBlock>;
    }
  | {
      op: "updateRequirement";
      target: {
        pageKey: string;
        fieldId: string;
      };
      value: Requirement;
    };

export type ThemeConfig = {
  tenantCode: string;
  logo: {
    url: string;
    altI18nKey: string;
  };
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    danger: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    baseFontSizePx: number;
  };
};

export type FormRuntime = {
  formId: string;
  tenantId: string;
  theme: ThemeConfig;
  schema: FormSchema;
};

export type AntragsdetailsFormValues = {
  selectedMedia: string[];
  requestType: string;
  changeKind: string;
  wunschtermin: string;
  message: string;
};
