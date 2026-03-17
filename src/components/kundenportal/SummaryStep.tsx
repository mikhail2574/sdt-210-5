"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { SummaryReviewCard } from "@/components/kundenportal/SummaryReviewCard";
import { usePortalApp } from "@/hooks/usePortalApp";
import type { MissingItem } from "@/lib/demo/public-flow";
import type { ThemeConfig } from "@/lib/forms/types";
import type { Locale } from "@/lib/i18n";
import { useAppStore } from "@/lib/state/app-store";

type SummaryStepProps = {
  applicationId: string;
  formId: string;
  locale: Locale;
  summary: {
    pages: Array<{
      pageKey: string;
      data: Record<string, unknown>;
      missing: {
        hard: MissingItem[];
        soft: MissingItem[];
        attachments: MissingItem[];
      };
    }>;
    missingSummary: {
      hard: MissingItem[];
      soft: MissingItem[];
      attachments: MissingItem[];
    };
  };
  theme: ThemeConfig;
};

export function SummaryStep({ applicationId, formId, locale, summary, theme }: SummaryStepProps) {
  const t = useTranslations();
  const router = useRouter();
  const { submitPublicApplication } = usePortalApp();
  const clearFormSession = useAppStore((state) => state.clearFormSession);
  const saveIssuedCredential = useAppStore((state) => state.saveIssuedCredential);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = await submitPublicApplication(applicationId, {
        consents: {
          privacyPolicyAccepted: true,
          dataProcessingAccepted: true,
          emailCommunicationAccepted: true,
          consentVersion: "2026-03-10",
          language: locale
        }
      });

      saveIssuedCredential(payload);
      clearFormSession(formId);
      router.push(`/${locale}/forms/${formId}/final?applicationId=${applicationId}`);
    } catch {
      setSubmitError("summary.submitError");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PortalChrome currentPageKey="uebersicht" locale={locale} theme={theme}>
      <h1 className="wizard-page-title">{t("pages.uebersicht.title")}</h1>
      <p className="wizard-page-description">{t("pages.uebersicht.description")}</p>

      {summary.missingSummary.hard.length > 0 || summary.missingSummary.soft.length > 0 || summary.missingSummary.attachments.length > 0 ? (
        <section className="wizard-summary warning-summary">
          <h2>{t("summary.missingTitle")}</h2>
          <ul>
            {summary.missingSummary.hard.map((item) => (
              <li key={item.fieldPath}>{t("summary.missingHard", { field: t(item.labelKey) })}</li>
            ))}
            {summary.missingSummary.soft.map((item) => (
              <li key={item.fieldPath}>{t("summary.missingSoft", { field: t(item.labelKey) })}</li>
            ))}
            {summary.missingSummary.attachments.map((item) => (
              <li key={item.fieldPath}>{t("summary.missingAttachment", { field: t(item.labelKey) })}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="review-grid">
        {summary.pages.map((page) => (
          <SummaryReviewCard applicationId={applicationId} formId={formId} key={page.pageKey} locale={locale} page={page} />
        ))}
      </div>

      {submitError ? (
        <div aria-live="polite" className="wizard-status">
          <p>{t(submitError)}</p>
        </div>
      ) : null}

      <div className="wizard-actions">
        <Link className="wizard-button-secondary" href={`/${locale}/forms/${formId}/rechtliche-hinweise?applicationId=${applicationId}`}>
          {t("wizard.back")}
        </Link>
        <button className="wizard-button" disabled={isSubmitting} onClick={handleSubmit} type="button">
          {isSubmitting ? t("summary.submitting") : t("summary.submit")}
        </button>
      </div>
    </PortalChrome>
  );
}
