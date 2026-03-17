import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { MetricCard } from "@/components/backoffice/MetricCard";
import { NotificationsCard } from "@/components/backoffice/NotificationsCard";
import { QuickLinksCard } from "@/components/backoffice/QuickLinksCard";
import { getBackofficeApplicationsForTenants, getBackofficePageContext } from "@/lib/backend/server-data";
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

  const [messages, { notifications, tenantIds, unreadCount: notificationUnreadCount, user }] = await Promise.all([
    getMessages(locale as Locale),
    getBackofficePageContext(locale as Locale)
  ]);
  const applicationsPayload = await getBackofficeApplicationsForTenants(tenantIds);
  const applications = applicationsPayload.items;
  const unreadApplicationCount = applications.filter((item) => item.unreadByStaff).length;
  const submittedIncompleteCount = applications.filter((item) => item.status === "SUBMITTED_INCOMPLETE").length;
  const scheduledCount = applications.filter((item) => item.status === "SCHEDULED").length;

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notificationUnreadCount}
      userName={user.displayName}
    >
      <div className="dashboard-grid">
        <MetricCard label={messages.backoffice.metrics.unread} value={unreadApplicationCount} />
        <MetricCard label={messages.backoffice.metrics.incomplete} value={submittedIncompleteCount} />
        <MetricCard label={messages.backoffice.metrics.scheduled} value={scheduledCount} />
      </div>

      <section className="dashboard-grid">
        <QuickLinksCard
          locale={locale}
          quickIncompleteLabel={messages.backoffice.quickIncomplete}
          quickThemeLabel={messages.backoffice.quickTheme}
          quickUnreadLabel={messages.backoffice.quickUnread}
          title={messages.backoffice.quickLinks}
        />
        <NotificationsCard locale={locale} notifications={notifications} title={messages.backoffice.notifications} />
      </section>
    </BackofficeChrome>
  );
}
