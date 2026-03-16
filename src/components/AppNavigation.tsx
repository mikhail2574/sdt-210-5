"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/kundenportal/LanguageSwitcher";
import type { Locale } from "@/lib/i18n";

type AppNavigationProps = {
  locale: Locale;
};

export function AppNavigation({ locale }: AppNavigationProps) {
  const t = useTranslations();

  const links = [
    { href: `/${locale}`, label: t("appShell.home") },
    { href: `/${locale}/about`, label: t("appShell.about") },
    { href: `/${locale}/settings`, label: t("appShell.settings") },
    { href: `/${locale}/ocr-demo`, label: t("appShell.ocrDemo") },
    { href: `/${locale}/forms/hausanschluss-demo/antragsdetails`, label: t("appShell.wizard") },
    { href: `/${locale}/login`, label: t("appShell.customerLogin") },
    { href: `/${locale}/backoffice/login`, label: t("appShell.backoffice") }
  ];

  return (
    <header>
      <nav aria-label={t("appShell.navLabel")}>
        <ul>
          {links.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
          <li>
            <LanguageSwitcher locale={locale} />
          </li>
        </ul>
      </nav>
    </header>
  );
}
