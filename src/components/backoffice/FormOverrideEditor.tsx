"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { FormMessage } from "@/components/atoms/FormMessage";
import { TextArea } from "@/components/atoms/TextArea";
import { FormField } from "@/components/molecules/FormField";
import { usePortalApp } from "@/hooks/usePortalApp";
import type { FormOverrideOperation } from "@/lib/forms/types";

type FormOverrideEditorProps = {
  formId: string;
  initialOperations: FormOverrideOperation[];
  tenantId: string;
};

export function FormOverrideEditor({ formId, initialOperations, tenantId }: FormOverrideEditorProps) {
  const t = useTranslations();
  const router = useRouter();
  const { error, loading, updateFormOverride } = usePortalApp();
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
          await updateFormOverride(tenantId, formId, operations);
          router.refresh();
        } catch {
          setErrorKey("backoffice.actionError");
        }
      }}
    >
      <FormField htmlFor={`override-${formId}`} label={t("backoffice.overrideJson")}>
        <TextArea id={`override-${formId}`} onChange={(event) => setValue(event.target.value)} rows={12} value={value} />
      </FormField>
      {errorKey || error ? <FormMessage>{t(errorKey ?? "backoffice.actionError")}</FormMessage> : null}
      <Button disabled={loading} type="submit">
        {t("backoffice.overrideSubmit")}
      </Button>
    </form>
  );
}
