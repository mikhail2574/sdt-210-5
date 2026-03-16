import Link from "next/link";
import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { listDemoApplications, listDemoNotifications } from "@/lib/demo/demo-store";
import { requireServerStaffUser } from "@/lib/demo/server-auth";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type ApplicationsListPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    status?: string;
    unread?: string;
  }>;
};

export default async function ApplicationsListPage({ params, searchParams }: ApplicationsListPageProps) {
  const { locale } = await params;
  const filters = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);
  const user = await requireServerStaffUser(locale as Locale);
  const notifications = listDemoNotifications();
  let applications = listDemoApplications();

  if (filters.status) {
    applications = applications.filter((item) => item.status === filters.status);
  }

  if (filters.unread === "true") {
    applications = applications.filter((item) => item.unreadByStaff);
  }

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/applications`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notifications.length}
      userName={user.displayName}
    >
      <div className="panel-header">
        <div>
          <h2>{messages.backoffice.applicationsTitle}</h2>
          <p>{messages.backoffice.applicationsDescription}</p>
        </div>
        <a className="secondary-button" href="/api/tenants/tenant-demo/exports/applications.csv">
          {messages.backoffice.exportCsv}
        </a>
      </div>

      <form className="filters-bar" method="get">
        <select className="field-control" defaultValue={filters.status ?? ""} name="status">
          <option value="">{messages.backoffice.filters.allStatuses}</option>
          <option value="SUBMITTED_INCOMPLETE">SUBMITTED_INCOMPLETE</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="SCHEDULED">SCHEDULED</option>
        </select>
        <select className="field-control" defaultValue={filters.unread ?? ""} name="unread">
          <option value="">{messages.backoffice.filters.allReadStates}</option>
          <option value="true">{messages.backoffice.filters.unreadOnly}</option>
        </select>
        <button className="wizard-button" type="submit">
          {messages.backoffice.filters.apply}
        </button>
      </form>

      <div className="table-shell">
        <table className="applications-table">
          <thead>
            <tr>
              <th>{messages.backoffice.columns.createdAt}</th>
              <th>{messages.backoffice.columns.trackingCode}</th>
              <th>{messages.backoffice.columns.form}</th>
              <th>{messages.backoffice.columns.status}</th>
              <th>{messages.backoffice.columns.customer}</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.applicationId}>
                <td>{application.createdAt.slice(0, 10)}</td>
                <td>
                  <Link href={`/${locale}/backoffice/applications/${application.applicationId}`}>{application.trackingCode}</Link>
                  {application.unreadByStaff ? <span className="unread-pill">{messages.backoffice.unreadBadge}</span> : null}
                </td>
                <td>{application.formKey}</td>
                <td>{application.status}</td>
                <td>
                  {application.customerSummary.name}
                  <br />
                  <span>{application.customerSummary.address}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BackofficeChrome>
  );
}
