"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/kundenportal/LanguageSwitcher";
import { LogoutButton } from "@/components/backoffice/LogoutButton";
import type { Locale } from "@/lib/i18n";

type BackofficeChromeProps = {
  children: ReactNode;
  currentPath: string;
  locale: Locale;
  notifications: Array<{
    id: string;
    applicationId: string;
    label: string;
    createdAt: string;
  }>;
  unreadCount: number;
  userName: string;
};

export function BackofficeChrome({ children, currentPath, locale, notifications, unreadCount, userName }: BackofficeChromeProps) {
  const t = useTranslations();

  const navItems = [
    {
      href: `/${locale}/backoffice`,
      key: "backoffice.nav.dashboard"
    },
    {
      href: `/${locale}/backoffice/applications`,
      key: "backoffice.nav.applications"
    },
    {
      href: `/${locale}/backoffice/admin/invitations`,
      key: "backoffice.nav.invitations"
    },
    {
      href: `/${locale}/backoffice/admin/theme`,
      key: "backoffice.nav.theme"
    },
    {
      href: `/${locale}/backoffice/admin/forms`,
      key: "backoffice.nav.forms"
    }
  ];

  return (
    <main className="backoffice-shell">
      <div className="backoffice-container">
        <header className="backoffice-header">
          <div>
            <p className="backoffice-eyebrow">{t("backoffice.productLabel")}</p>
            <h1>{t("backoffice.title")}</h1>
            <p>{userName}</p>
          </div>
          <div className="backoffice-header-actions">
            <details className="notification-bell">
              <summary>
                {t("backoffice.notifications")} <span>{unreadCount}</span>
              </summary>
              <div className="notification-panel">
                {notifications.length === 0 ? <p>{t("backoffice.notificationsEmpty")}</p> : null}
                {notifications.map((notification) => (
                  <Link href={`/${locale}/backoffice/applications/${notification.applicationId}`} key={notification.id}>
                    {notification.label}
                  </Link>
                ))}
              </div>
            </details>
            <LanguageSwitcher locale={locale} />
            <LogoutButton locale={locale} />
          </div>
        </header>

        <nav aria-label={t("backoffice.navLabel")} className="backoffice-nav">
          {navItems.map((item) => (
            <Link aria-current={currentPath === item.href ? "page" : undefined} href={item.href} key={item.href}>
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <section className="backoffice-panel">{children}</section>
      </div>
    </main>
  );
}
