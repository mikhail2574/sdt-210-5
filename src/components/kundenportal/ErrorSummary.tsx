"use client";

import { useTranslations } from "next-intl";

type ErrorSummaryProps = {
  errors: Array<{
    fieldId: string;
    messageKey: string;
  }>;
};

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const t = useTranslations();

  if (errors.length === 0) {
    return null;
  }

  return (
    <section className="wizard-summary" aria-live="assertive" role="alert">
      <h2>{t("wizard.errorSummaryTitle")}</h2>
      <p>{t("wizard.errorSummaryDescription")}</p>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a href={`#field-${error.fieldId}`}>{t(error.messageKey)}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
