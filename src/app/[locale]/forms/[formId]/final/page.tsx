import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FinalCredentialCard } from "@/components/kundenportal/FinalCredentialCard";
import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { getPublicApplication } from "@/lib/backend/server-data";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { resolveRouteFormId } from "@/lib/forms/demo-catalog";
import { isLocale, getMessages, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type FinalPageProps = {
  params: Promise<{
    locale: string;
    formId: string;
  }>;
  searchParams: Promise<{
    applicationId?: string;
  }>;
};

export default async function FinalPage({ params, searchParams }: FinalPageProps) {
  const { locale, formId } = await params;
  const { applicationId } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  if (!applicationId) {
    redirect(`/${locale}/forms/${formId}/antragsdetails`);
  }

  const [messages, runtime, application] = await Promise.all([
    getMessages(locale as Locale),
    getResolvedFormRuntime(formId),
    getPublicApplication(applicationId)
  ]);

  if (!application || !application.trackingCode) {
    notFound();
  }

  const missingItems = [
    ...application.missingSummary.hard,
    ...application.missingSummary.soft,
    ...application.missingSummary.attachments
  ];
  const routeFormId = resolveRouteFormId(application.formId);

  return (
    <PortalChrome currentPageKey="final" locale={locale as Locale} theme={runtime.theme}>
      <h1 className="wizard-page-title">{messages.pages.final.title}</h1>
      <p className="wizard-page-description">{messages.pages.final.description}</p>

      <FinalCredentialCard applicationId={applicationId} trackingCode={application.trackingCode} />

      {missingItems.length > 0 ? (
        <section className="wizard-summary warning-summary">
          <h2>{messages.finalPage.missingTitle}</h2>
          <ul>
            {missingItems.map((item) => (
              <li key={item.fieldPath}>
                <Link href={`/${locale}/forms/${routeFormId}/${item.pageKey}?applicationId=${applicationId}`}>
                  {messages.finalPage.missingLinkPrefix} {resolveMessage(messages, item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="wizard-actions">
        <a className="wizard-button-secondary" href={`/api/public/applications/${applicationId}/pdf?kind=APPLICATION_PDF`}>
          {messages.finalPage.downloadPdf}
        </a>
        <Link className="wizard-button" href={`/${locale}/applications/${applicationId}`}>
          {messages.finalPage.relogin}
        </Link>
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
