import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { FormOverrideEditor } from "@/components/backoffice/FormOverrideEditor";
import { getDemoFormOverride, listDemoForms, listDemoNotifications } from "@/lib/demo/demo-store";
import { requireServerStaffUser } from "@/lib/demo/server-auth";
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
  const notifications = listDemoNotifications();
  const forms = listDemoForms();

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/admin/forms`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notifications.length}
      userName={user.displayName}
    >
      <div className="panel-header">
        <div>
          <h2>{messages.backoffice.formsTitle}</h2>
          <p>{messages.backoffice.formsDescription}</p>
        </div>
      </div>

      <div className="review-grid">
        {forms.map((form) => (
          <section className="review-card" key={form.formId}>
            <h3>{messages.forms.hausanschluss.title}</h3>
            <p>{form.formId}</p>
            <FormOverrideEditor formId={form.formId} initialOperations={getDemoFormOverride(form.formId)} tenantId={user.tenantId} />
          </section>
        ))}
      </div>
    </BackofficeChrome>
  );
}
