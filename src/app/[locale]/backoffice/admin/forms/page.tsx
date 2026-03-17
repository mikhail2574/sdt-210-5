import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { FormOverrideEditor } from "@/components/backoffice/FormOverrideEditor";
import { getBackofficeFormOverride, getBackofficeForms, getBackofficeNotifications, requireServerStaffUser } from "@/lib/backend/server-data";
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

  const messages = await getMessages(locale as Locale);
  const user = await requireServerStaffUser(locale as Locale);
  const [notificationsPayload, forms] = await Promise.all([
    getBackofficeNotifications(user.tenantId),
    getBackofficeForms(user.tenantId)
  ]);
  const notifications = notificationsPayload.items;
  const formOverrides = await Promise.all(forms.map((form) => getBackofficeFormOverride(user.tenantId, form.formId)));

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/admin/forms`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notificationsPayload.unreadCount}
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
