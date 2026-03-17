import Link from "next/link";
import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { getBackofficeApplicationsForTenants, getBackofficeNotificationsForTenants, requireServerStaffUser } from "@/lib/backend/server-data";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);
  const user = await requireServerStaffUser(locale as Locale);
  const tenantIds = user.tenants.map((tenant) => tenant.tenantId);
  const [applicationsPayload, notificationsPayload] = await Promise.all([
    getBackofficeApplicationsForTenants(tenantIds),
    getBackofficeNotificationsForTenants(tenantIds)
  ]);
  const applications = applicationsPayload.items;
  const notifications = notificationsPayload.items;
  const unreadCount = applications.filter((item) => item.unreadByStaff).length;
  const submittedIncompleteCount = applications.filter((item) => item.status === "SUBMITTED_INCOMPLETE").length;
  const scheduledCount = applications.filter((item) => item.status === "SCHEDULED").length;

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notificationsPayload.unreadCount}
      userName={user.displayName}
    >
      <div className="dashboard-grid">
        <article className="metric-card">
          <h2>{messages.backoffice.metrics.unread}</h2>
          <strong>{unreadCount}</strong>
        </article>
        <article className="metric-card">
          <h2>{messages.backoffice.metrics.incomplete}</h2>
          <strong>{submittedIncompleteCount}</strong>
        </article>
        <article className="metric-card">
          <h2>{messages.backoffice.metrics.scheduled}</h2>
          <strong>{scheduledCount}</strong>
        </article>
      </div>

      <section className="dashboard-grid">
        <article className="metric-card">
          <h2>{messages.backoffice.quickLinks}</h2>
          <div className="stack-links">
            <Link href={`/${locale}/backoffice/applications?unread=true`}>{messages.backoffice.quickUnread}</Link>
            <Link href={`/${locale}/backoffice/applications?status=SUBMITTED_INCOMPLETE`}>{messages.backoffice.quickIncomplete}</Link>
            <Link href={`/${locale}/backoffice/admin/theme`}>{messages.backoffice.quickTheme}</Link>
          </div>
        </article>

        <article className="metric-card">
          <h2>{messages.backoffice.notifications}</h2>
          <ul className="compact-list">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link href={`/${locale}/backoffice/applications/${notification.applicationId}`}>{notification.label}</Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </BackofficeChrome>
  );
}
