import { notFound } from "next/navigation";

import { BackofficeChrome } from "@/components/backoffice/BackofficeChrome";
import { ThemeEditorForm } from "@/components/backoffice/ThemeEditorForm";
import { getDemoTenantTheme, listDemoNotifications } from "@/lib/demo/demo-store";
import { requireServerStaffUser } from "@/lib/demo/server-auth";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type ThemeAdminPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ThemeAdminPage({ params }: ThemeAdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);
  const user = await requireServerStaffUser(locale as Locale);
  const notifications = listDemoNotifications();
  const theme = getDemoTenantTheme();

  return (
    <BackofficeChrome
      currentPath={`/${locale}/backoffice/admin/theme`}
      locale={locale as Locale}
      notifications={notifications}
      unreadCount={notifications.length}
      userName={user.displayName}
    >
      <div className="panel-header">
        <div>
          <h2>{messages.backoffice.themeTitle}</h2>
          <p>{messages.backoffice.themeDescription}</p>
        </div>
      </div>

      <div className="status-grid">
        <section className="review-card">
          <h3>{messages.backoffice.themeEditor}</h3>
          <ThemeEditorForm tenantId={user.tenantId} theme={theme} />
        </section>

        <section className="review-card theme-preview-card" style={{ borderColor: theme.palette.primary }}>
          <h3>{messages.backoffice.themePreview}</h3>
          <p style={{ color: theme.palette.secondary }}>{messages.backoffice.themePreviewCopy}</p>
          <button className="wizard-button" style={{ background: theme.palette.primary }} type="button">
            {messages.backoffice.themePreviewButton}
          </button>
        </section>
      </div>
    </BackofficeChrome>
  );
}
