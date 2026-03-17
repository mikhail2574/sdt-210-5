import { notFound } from "next/navigation";

import { GenericWizardForm } from "@/components/kundenportal/GenericWizardForm";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { getDraft } from "@/lib/forms/store";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type TechnischeDatenPageProps = {
  params: Promise<{
    locale: string;
    formId: string;
  }>;
  searchParams: Promise<{
    applicationId?: string;
  }>;
};

export default async function TechnischeDatenPage({ params, searchParams }: TechnischeDatenPageProps) {
  const { locale, formId } = await params;
  const { applicationId } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const [runtime, draft] = await Promise.all([
    getResolvedFormRuntime(formId),
    applicationId ? getDraft(applicationId) : Promise.resolve(null)
  ]);

  return (
    <GenericWizardForm
      applicationId={applicationId ?? null}
      formId={formId}
      initialValues={draft?.pageData["technische-daten"]}
      locale={locale as Locale}
      pageKey="technische-daten"
      theme={runtime.theme}
    />
  );
}
