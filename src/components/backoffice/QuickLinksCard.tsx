import Link from "next/link";

type QuickLinksCardProps = {
  locale: string;
  quickIncompleteLabel: string;
  quickThemeLabel: string;
  quickUnreadLabel: string;
  title: string;
};

export function QuickLinksCard({ locale, quickIncompleteLabel, quickThemeLabel, quickUnreadLabel, title }: QuickLinksCardProps) {
  return (
    <article className="metric-card">
      <h2>{title}</h2>
      <div className="stack-links">
        <Link href={`/${locale}/backoffice/applications?unread=true`}>{quickUnreadLabel}</Link>
        <Link href={`/${locale}/backoffice/applications?status=SUBMITTED_INCOMPLETE`}>{quickIncompleteLabel}</Link>
        <Link href={`/${locale}/backoffice/admin/theme`}>{quickThemeLabel}</Link>
      </div>
    </article>
  );
}
