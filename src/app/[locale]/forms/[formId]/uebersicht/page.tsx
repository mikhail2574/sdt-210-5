import { notFound, redirect } from "next/navigation";

import { SummaryStep } from "@/components/kundenportal/SummaryStep";
import { getDemoApplicationSummary } from "@/lib/demo/demo-store";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type UebersichtPageProps = {
  params: Promise<{
    locale: string;
    formId: string;
  }>;
  searchParams: Promise<{
    applicationId?: string;
  }>;
};

export default async function UebersichtPage({ params, searchParams }: UebersichtPageProps) {
  const { locale, formId } = await params;
  const { applicationId } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  if (!applicationId) {
    redirect(`/${locale}/forms/${formId}/antragsdetails`);
  }

  const runtime = await getResolvedFormRuntime(formId);
  const summary = getDemoApplicationSummary(applicationId);

  if (!summary) {
    notFound();
  }

  return <SummaryStep applicationId={applicationId} formId={formId} locale={locale as Locale} summary={summary} theme={runtime.theme} />;
}
