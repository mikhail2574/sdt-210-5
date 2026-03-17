import Link from "next/link";

type NotificationsCardProps = {
  locale: string;
  notifications: Array<{
    applicationId: string;
    id: string;
    label: string;
  }>;
  title: string;
};

export function NotificationsCard({ locale, notifications, title }: NotificationsCardProps) {
  return (
    <article className="metric-card">
      <h2>{title}</h2>
      <ul className="compact-list">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <Link href={`/${locale}/backoffice/applications/${notification.applicationId}`}>{notification.label}</Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
