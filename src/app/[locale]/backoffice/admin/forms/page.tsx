import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { FormOverrideEditor } from "@/components/backoffice/FormOverrideEditor";
import { getBackofficeFormOverride, getBackofficeForms, getBackofficePageContext } from "@/lib/backend/server-data";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type FormsAdminPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function FormsAdminPage({ params }: FormsAdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [messages, { notifications, unreadCount, user }] = await Promise.all([
    getMessages(locale as Locale),
    getBackofficePageContext(locale as Locale)
  ]);
  const forms = await getBackofficeForms(user.tenantId);
  const formOverrides = await Promise.all(forms.map((form) => getBackofficeFormOverride(user.tenantId, form.formId)));

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/admin/forms`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={unreadCount}
      userName={user.displayName}
    >
      <div className="panel-header">
        <div>
          <h2>{messages.backoffice.formsTitle}</h2>
          <p>{messages.backoffice.formsDescription}</p>
        </div>
      </div>

      <div className="review-grid">
        {forms.map((form, index) => (
          <section className="review-card" key={form.formId}>
            <h3>{resolveMessage(messages, form.titleI18nKey)}</h3>
            <p>{form.formId}</p>
            <FormOverrideEditor formId={form.formId} initialOperations={formOverrides[index].operations} tenantId={user.tenantId} />
          </section>
        ))}
      </div>
    </BackofficeChrome>
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
