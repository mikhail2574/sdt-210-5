"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/kundenportal/LanguageSwitcher";
import { publicWizardPageOrder, type PublicWizardPageKey } from "@/lib/demo/public-flow";
import { getThemeVariables } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/forms/types";
import type { Locale } from "@/lib/i18n";

type PortalChromeProps = {
  children: ReactNode;
  currentPageKey?: PublicWizardPageKey;
  locale: Locale;
  theme: ThemeConfig;
  title?: string;
};

export function PortalChrome({ children, currentPageKey, locale, theme, title }: PortalChromeProps) {
  const t = useTranslations();

  return (
    <main className="wizard-shell" style={getThemeVariables(theme)}>
      <div className="wizard-container">
        <header className="wizard-header">
          <div className="wizard-brand">
            <img alt={t(theme.logo.altI18nKey)} src={theme.logo.url} />
            <div>
              <p>{t("wizard.headerTitle")}</p>
              <strong>{title ?? t("forms.hausanschluss.title")}</strong>
            </div>
          </div>
          <LanguageSwitcher locale={locale} />
        </header>

        {currentPageKey ? (
          <nav aria-label={t("wizard.stepperLabel")} className="wizard-stepper">
            {publicWizardPageOrder.map((pageKey, index) => {
              const currentIndex = publicWizardPageOrder.indexOf(currentPageKey);
              const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";

              return (
                <div aria-current={state === "current" ? "step" : undefined} className={`wizard-step wizard-step-${state}`} key={pageKey}>
                  <span className="wizard-step-count">{index + 1}</span>
                  <span>{t(`pages.${normalizePageKey(pageKey)}.title`)}</span>
                </div>
              );
            })}
          </nav>
        ) : null}

        <div className="wizard-panel">{children}</div>

        <footer className="portal-footer">
          <a href="#privacy">{t("links.privacy")}</a>
          <a href="#imprint">{t("links.imprint")}</a>
          <a href="#accessibility">{t("links.accessibility")}</a>
        </footer>
      </div>
    </main>
  );
}

function normalizePageKey(pageKey: string) {
  if (pageKey === "technische-daten") {
    return "technischeDaten";
  }

  if (pageKey === "rechtliche-hinweise") {
    return "rechtlicheHinweise";
  }

  return pageKey;
}
