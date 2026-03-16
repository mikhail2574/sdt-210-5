"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";
import type { FormOverrideOperation } from "@/lib/forms/types";

type FormOverrideEditorProps = {
  formId: string;
  initialOperations: FormOverrideOperation[];
  tenantId: string;
};

export function FormOverrideEditor({ formId, initialOperations, tenantId }: FormOverrideEditorProps) {
  const t = useTranslations();
  const router = useRouter();
  const { backoffice } = useFrontendApi();
  const [value, setValue] = useState(JSON.stringify(initialOperations, null, 2));
  const [errorKey, setErrorKey] = useState<string | null>(null);

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorKey(null);

        let operations: FormOverrideOperation[];

        try {
          operations = JSON.parse(value) as FormOverrideOperation[];
        } catch {
          setErrorKey("backoffice.overrideError");
          return;
        }

        try {
          await backoffice.updateFormOverride(tenantId, formId, operations);
          router.refresh();
        } catch {
          setErrorKey("backoffice.actionError");
        }
      }}
    >
      <label htmlFor={`override-${formId}`}>{t("backoffice.overrideJson")}</label>
      <textarea className="field-control-textarea" id={`override-${formId}`} onChange={(event) => setValue(event.target.value)} rows={12} value={value} />
      {errorKey ? <p className="field-message">{t(errorKey)}</p> : null}
      <button className="wizard-button" type="submit">
        {t("backoffice.overrideSubmit")}
      </button>
    </form>
  );
}
