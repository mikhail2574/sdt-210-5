"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import type { Locale } from "@/lib/i18n";

type SummaryReviewCardProps = {
  applicationId: string;
  formId: string;
  locale: Locale;
  page: {
    data: Record<string, unknown>;
    pageKey: string;
  };
};

export function SummaryReviewCard({ applicationId, formId, locale, page }: SummaryReviewCardProps) {
  const t = useTranslations();

  return (
    <section className="review-card">
      <div className="review-card-header">
        <div>
          <h2>{t(`pages.${normalizePageKey(page.pageKey)}.title`)}</h2>
          <p>{t("summary.fieldCount", { count: Object.keys(page.data).length })}</p>
        </div>
        {page.pageKey !== "rechtliche-hinweise" ? (
          <Link className="inline-link" href={`/${locale}/forms/${formId}/${page.pageKey}?applicationId=${applicationId}`}>
            {t("summary.edit")}
          </Link>
        ) : null}
      </div>
      <dl className="review-list">
        {Object.entries(page.data).map(([fieldKey, value]) => (
          <div key={fieldKey}>
            <dt>{t(`fields.${fieldKey}.label`)}</dt>
            <dd>{formatValue(t, value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatValue(t: ReturnType<typeof useTranslations>, value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return t("summary.emptyValue");
    }

    return value
      .map((item) => {
        if (typeof item === "string") {
          return maybeTranslateOption(t, item);
        }

        if (typeof item === "object" && item !== null && "name" in item) {
          return String((item as { name: string }).name);
        }

        return String(item);
      })
      .join(", ");
  }

  if (value === true) {
    return t("summary.booleanYes");
  }

  if (value === false) {
    return t("summary.booleanNo");
  }

  if (typeof value === "string" && value.length > 0) {
    return maybeTranslateOption(t, value);
  }

  return t("summary.emptyValue");
}

function maybeTranslateOption(t: ReturnType<typeof useTranslations>, value: string) {
  const optionKeys = [
    `options.objectType.${value}`,
    `options.usageType.${value}`,
    `options.salutation.${value}`,
    `options.electricianMode.${value}`,
    `media.${value}`,
    `requestType.${value === "new_connection" ? "new" : value === "change_connection" ? "change" : value}`,
    `changeKind.${value === "anlagen_erweiterung" ? "erweiterung" : value === "zusammenlegung" ? "zusammenlegung" : value}`
  ];

  for (const key of optionKeys) {
    try {
      return t(key);
    } catch {}
  }

  return value;
}

function normalizePageKey(pageKey: string) {
  if (pageKey === "technische-daten") {
    return "technischeDaten";
  }

  if (pageKey === "rechtliche-hinweise") {
    return "rechtlicheHinweise";
  }

  return pageKey;
}
