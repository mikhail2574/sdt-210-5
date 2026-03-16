import { notFound } from "next/navigation";

import { GenericWizardForm } from "@/components/kundenportal/GenericWizardForm";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { getDraft } from "@/lib/forms/store";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type RechtlicheHinweisePageProps = {
  params: Promise<{
    locale: string;
    formId: string;
  }>;
  searchParams: Promise<{
    applicationId?: string;
  }>;
};

export default async function RechtlicheHinweisePage({ params, searchParams }: RechtlicheHinweisePageProps) {
  const { locale, formId } = await params;
  const { applicationId } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const runtime = await getResolvedFormRuntime(formId);
  const draft = applicationId ? getDraft(applicationId) : null;

  return (
    <GenericWizardForm
      applicationId={applicationId ?? null}
      formId={formId}
      initialValues={draft?.pageData["rechtliche-hinweise"]}
      locale={locale as Locale}
      pageKey="rechtliche-hinweise"
      theme={runtime.theme}
    />
  );
}
