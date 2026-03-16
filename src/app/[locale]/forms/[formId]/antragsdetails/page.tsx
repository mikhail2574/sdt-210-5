import { notFound } from "next/navigation";

import { AntragsdetailsWizard } from "@/components/kundenportal/AntragsdetailsWizard";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { getDraft } from "@/lib/forms/store";
import { getPageSchema } from "@/lib/forms/runtime";
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

  const runtime = await getResolvedFormRuntime(formId);

  const page = runtime.schema.form.pages.find((pageItem) => pageItem.key === "antragsdetails") ?? getPageSchema(formId, "antragsdetails");

  if (!page) {
    notFound();
  }

  const draft = applicationId ? getDraft(applicationId) : null;

  return (
    <AntragsdetailsWizard
      formId={formId}
      initialApplicationId={applicationId ?? null}
      initialValues={draft?.pageData["antragsdetails"]}
      locale={locale as Locale}
      page={page}
      theme={runtime.theme}
    />
  );
}
