"use client";

import { useTranslations } from "next-intl";

export type WizardFieldMessageError = {
  labelKey?: string;
  messageKey: string;
};

type WizardFieldMessageProps = {
  error?: WizardFieldMessageError;
  fieldMessageId: string;
  hasSoftMissing: boolean;
  softRequiredWarningKey: string;
};

export function WizardFieldMessage({ error, fieldMessageId, hasSoftMissing, softRequiredWarningKey }: WizardFieldMessageProps) {
  const t = useTranslations();

  if (error) {
    return (
      <p aria-live="polite" className="field-message" id={fieldMessageId}>
        {error.messageKey === "validation.requiredField" || error.messageKey === "validation.requiredAttachment"
          ? t(error.messageKey, { field: error.labelKey ? t(error.labelKey) : "" })
          : t(error.messageKey)}
      </p>
    );
  }

  if (hasSoftMissing) {
    return (
      <p aria-live="polite" className="field-message warning" id={fieldMessageId}>
        {t(softRequiredWarningKey)}
      </p>
    );
  }

  return null;
}
