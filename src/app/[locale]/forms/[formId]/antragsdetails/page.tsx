import { notFound } from "next/navigation";

import { AntragsdetailsWizard } from "@/components/kundenportal/AntragsdetailsWizard";
import { getDraft } from "@/lib/forms/store";
import { getPageSchema, getFormRuntime } from "@/lib/forms/runtime";
import { isLocale, type Locale } from "@/lib/i18n";

type AntragsdetailsRouteProps = {
  params: Promise<{
    locale: string;
    formId: string;
  }>;
  searchParams: Promise<{
    applicationId?: string;
  }>;
};

export default async function AntragsdetailsRoute({ params, searchParams }: AntragsdetailsRouteProps) {
  const { locale, formId } = await params;
  const { applicationId } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const runtime = getFormRuntime(formId);
  const page = getPageSchema(formId, "antragsdetails");

  if (!page) {
    notFound();
  }

  const draft = applicationId ? getDraft(applicationId) : null;

  return (
    <AntragsdetailsWizard
      formId={formId}
      initialApplicationId={applicationId ?? null}
      initialValues={draft?.data}
      locale={locale as Locale}
      page={page}
      theme={runtime.theme}
    />
  );
}
