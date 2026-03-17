import { notFound } from "next/navigation";

import { ApplicationAuditLog } from "@/components/backoffice/ApplicationAuditLog";
import { ApplicationActions } from "@/components/backoffice/ApplicationActions";
import { ApplicationHeader } from "@/components/backoffice/ApplicationHeader";
import { ApplicationPageDataGrid } from "@/components/backoffice/ApplicationPageDataGrid";
import { ApplicationStatusGrid } from "@/components/backoffice/ApplicationStatusGrid";
import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { getBackofficeApplicationDetailForTenants, getBackofficePageContext } from "@/lib/backend/server-data";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type ApplicationDetailPageProps = {
  params: Promise<{
    locale: string;
    applicationId: string;
  }>;
};

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { locale, applicationId } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [messages, { notifications, tenantIds, unreadCount, user }] = await Promise.all([
    getMessages(locale as Locale),
    getBackofficePageContext(locale as Locale)
  ]);
  const application = await getBackofficeApplicationDetailForTenants(tenantIds, applicationId);

  if (!application) {
    notFound();
  }

  const editableFields = Object.entries(application.pageData).flatMap(([pageKey, data]) =>
    Object.entries(data).map(([fieldKey, value]) => ({
      fieldPath: `${pageKey}.${fieldKey}`,
      label: `${pageKey}.${fieldKey}`,
      value: Array.isArray(value) ? value.join(", ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")
    }))
  );

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/applications`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={unreadCount}
      userName={user.displayName}
    >
      <ApplicationHeader
        application={application}
        applicationId={applicationId}
        downloadPdfLabel={messages.backoffice.downloadPdf}
        locale={locale}
        openCustomerViewLabel={messages.backoffice.openCustomerView}
      />

      <ApplicationStatusGrid
        application={application}
        modifiedFieldsTitle={messages.backoffice.modifiedFieldsTitle}
        statusTitle={messages.backoffice.statusTitle}
        timelineTitle={messages.backoffice.timelineTitle}
      />

      <ApplicationActions applicationId={applicationId} editableFields={editableFields} tenantId={application.tenantId} />

      <ApplicationPageDataGrid pageData={application.pageData} />

      <ApplicationAuditLog
        auditChangedToLabel={messages.backoffice.auditChangedTo}
        auditEntries={application.auditLog}
        title={messages.backoffice.auditTitle}
      />
    </BackofficeChrome>
  );
}
