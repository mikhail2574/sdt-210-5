import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationActions } from "@/components/backoffice/ApplicationActions";
import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { getBackofficeApplicationDetailForTenants, getBackofficeNotificationsForTenants, requireServerStaffUser } from "@/lib/backend/server-data";
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

  const messages = await getMessages(locale as Locale);
  const user = await requireServerStaffUser(locale as Locale);
  const tenantIds = user.tenants.map((tenant) => tenant.tenantId);
  const [notificationsPayload, application] = await Promise.all([
    getBackofficeNotificationsForTenants(tenantIds),
    getBackofficeApplicationDetailForTenants(tenantIds, applicationId)
  ]);
  const notifications = notificationsPayload.items;

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
      unreadCount={notificationsPayload.unreadCount}
      userName={user.displayName}
    >
      <div className="panel-header">
        <div>
          <h2>{application.customerSummary.name}</h2>
          <p>{application.customerSummary.address}</p>
        </div>
        <div className="panel-header-actions">
          <a className="secondary-button" href={`/api/tenants/${application.tenantId}/applications/${applicationId}/pdf?kind=APPLICATION_PDF`}>
            {messages.backoffice.downloadPdf}
          </a>
          <Link className="inline-link" href={`/${locale}/applications/${applicationId}`}>
            {messages.backoffice.openCustomerView}
          </Link>
        </div>
      </div>

      <div className="status-grid">
        <section className="status-card">
          <h3>{messages.backoffice.statusTitle}</h3>
          <p className="status-chip">{application.status}</p>
          <p>{application.trackingCode}</p>
          {application.staffModifiedFields.length > 0 ? (
            <p>
              {messages.backoffice.modifiedFieldsTitle}: {application.staffModifiedFields.length}
            </p>
          ) : null}
        </section>

        <section className="status-card">
          <h3>{messages.backoffice.timelineTitle}</h3>
          <ol className="timeline-list">
            {application.timeline.map((entry) => (
              <li key={`${entry.status}-${entry.at}`}>
                <strong>{entry.status}</strong>
                <span>{entry.note ?? entry.at}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ApplicationActions applicationId={applicationId} editableFields={editableFields} tenantId={application.tenantId} />

      <section className="review-grid">
        {Object.entries(application.pageData).map(([pageKey, data]) => (
          <article className="review-card" key={pageKey}>
            <h3>{pageKey}</h3>
            <dl className="review-list">
              {Object.entries(data).map(([fieldKey, value]) => (
                <div key={fieldKey}>
                  <dt>{fieldKey}</dt>
                  <dd>{Array.isArray(value) ? JSON.stringify(value) : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>

      <section className="review-card">
        <h3>{messages.backoffice.auditTitle}</h3>
        <ul className="compact-list">
          {application.auditLog.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.fieldPath}</strong> {messages.backoffice.auditChangedTo} {String(entry.newValue)} ({entry.reason})
            </li>
          ))}
        </ul>
      </section>
    </BackofficeChrome>
  );
}
