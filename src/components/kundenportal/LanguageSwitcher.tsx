"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { locales, type Locale } from "@/lib/i18n";
import { useAppStore } from "@/lib/state/app-store";

type LanguageSwitcherProps = {
  locale: Locale;
};

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const setPreferredLocale = useAppStore((state) => state.setPreferredLocale);

  return (
    <nav aria-label={t("language.label")} className="wizard-language">
      <span>{t("language.label")}</span>
      {locales.map((candidate) => {
        const href = pathname.replace(`/${locale}`, `/${candidate}`);

        return (
          <Link
            href={href}
            key={candidate}
            aria-current={candidate === locale ? "page" : undefined}
            onClick={() => {
              setPreferredLocale(candidate);
            }}
          >
            {t(`language.${candidate}`)}
          </Link>
        );
      })}
    </nav>
  );
}
