import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerLogoutButton } from "@/components/kundenportal/CustomerLogoutButton";
import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { getDemoCustomerApplication } from "@/lib/demo/demo-store";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { requireServerCustomerApplicationId } from "@/lib/demo/server-auth";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type CustomerApplicationPageProps = {
  params: Promise<{
    locale: string;
    applicationId: string;
  }>;
};

export default async function CustomerApplicationPage({ params }: CustomerApplicationPageProps) {
  const { locale, applicationId } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);
  await requireServerCustomerApplicationId(locale as Locale, applicationId);
  const application = getDemoCustomerApplication(applicationId);

  if (!application) {
    notFound();
  }

  const runtime = await getResolvedFormRuntime(application.formId);
  const resumePageKey =
    application.missingSummary.hard[0]?.pageKey ??
    application.missingSummary.soft[0]?.pageKey ??
    application.missingSummary.attachments[0]?.pageKey ??
    application.currentPageKey;

  return (
    <PortalChrome locale={locale as Locale} theme={runtime.theme}>
      <h1 className="wizard-page-title">{messages.customerStatus.title}</h1>
      <p className="wizard-page-description">{messages.customerStatus.description}</p>

      <div className="status-grid">
        <section className="status-card">
          <h2>{messages.customerStatus.statusLabel}</h2>
          <p className="status-chip">{application.status}</p>
          <p>{application.customerSummary.name}</p>
          <p>{application.customerSummary.address}</p>
        </section>

        <section className="status-card">
          <h2>{messages.customerStatus.timelineTitle}</h2>
          <ol className="timeline-list">
            {application.timeline.map((entry) => (
              <li key={`${entry.status}-${entry.at}`}>
                <strong>{entry.status}</strong>
                <span>{entry.note ?? entry.at}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {application.missingSummary.hard.length > 0 || application.missingSummary.soft.length > 0 || application.missingSummary.attachments.length > 0 ? (
        <section className="wizard-summary warning-summary">
          <h2>{messages.customerStatus.missingTitle}</h2>
          <ul>
            {application.missingSummary.hard.map((item) => (
              <li key={item.fieldPath}>{resolveMessage(messages, item.labelKey)}</li>
            ))}
            {application.missingSummary.soft.map((item) => (
              <li key={item.fieldPath}>{resolveMessage(messages, item.labelKey)}</li>
            ))}
            {application.missingSummary.attachments.map((item) => (
              <li key={item.fieldPath}>{resolveMessage(messages, item.labelKey)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="wizard-actions">
        <a className="wizard-button-secondary" href={`/api/public/applications/${applicationId}/pdf?kind=APPLICATION_PDF`}>
          {messages.customerStatus.downloadPdf}
        </a>
        <Link className="wizard-button" href={`/${locale}/forms/${application.formId}/${resumePageKey}?applicationId=${applicationId}`}>
          {messages.customerStatus.resume}
        </Link>
        <CustomerLogoutButton locale={locale as Locale} />
      </div>
    </PortalChrome>
  );
}

function resolveMessage(messages: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) {
      return key;
    }

    return (current as Record<string, unknown>)[segment] ?? key;
  }, messages) as string;
}
