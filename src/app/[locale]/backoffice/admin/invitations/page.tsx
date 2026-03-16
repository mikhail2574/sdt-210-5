import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { InviteUserForm } from "@/components/backoffice/InviteUserForm";
import { listDemoInvitations, listDemoNotifications } from "@/lib/demo/demo-store";
import { requireServerStaffUser } from "@/lib/demo/server-auth";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type InvitationsAdminPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function InvitationsAdminPage({ params }: InvitationsAdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);
  const user = await requireServerStaffUser(locale as Locale);
  const notifications = listDemoNotifications();
  const invitations = listDemoInvitations();

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/admin/invitations`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notifications.length}
      userName={user.displayName}
    >
      <div className="panel-header">
        <div>
          <h2>{messages.backoffice.invitationsTitle}</h2>
          <p>{messages.backoffice.invitationsDescription}</p>
        </div>
      </div>

      <div className="status-grid">
        <section className="review-card">
          <h3>{messages.backoffice.inviteNew}</h3>
          <InviteUserForm tenantId={user.tenantId} />
        </section>
        <section className="review-card">
          <h3>{messages.backoffice.sentInvitations}</h3>
          <ul className="compact-list">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <strong>{invitation.email}</strong> {invitation.role} · {invitation.status}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </BackofficeChrome>
  );
}
