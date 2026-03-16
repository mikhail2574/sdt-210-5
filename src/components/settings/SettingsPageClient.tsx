"use client";

import { useTranslations } from "next-intl";

import { resetAppStore, useAppStore, useAppStoreHydrated } from "@/lib/state/app-store";

type SettingsPageClientProps = {
  backendSnapshot: {
    applications: number;
    invitations: number;
    ocrJobs: number;
    theme: {
      palette: {
        primary: string;
        secondary: string;
        accent: string;
      };
      typography: {
        baseFontSizePx: number;
      };
    };
  };
};

export function SettingsPageClient({ backendSnapshot }: SettingsPageClientProps) {
  const t = useTranslations();
  const hydrated = useAppStoreHydrated();
  const preferredLocale = useAppStore((state) => state.preferredLocale);
  const formSessions = useAppStore((state) => state.formSessions);
  const backofficeSession = useAppStore((state) => state.backofficeSession);
  const issuedCredentials = useAppStore((state) => state.issuedCredentials);

  return (
    <main>
      <h1>{t("settingsPage.title")}</h1>
      <p>{t("settingsPage.description")}</p>

      <section>
        <h2>{t("settingsPage.backendTitle")}</h2>
        <pre>{JSON.stringify(backendSnapshot, null, 2)}</pre>
      </section>

      <section>
        <h2>{t("settingsPage.clientStateTitle")}</h2>
        <p>{t("settingsPage.hydrated", { value: String(hydrated) })}</p>
        <p>{t("settingsPage.preferredLocale", { locale: preferredLocale })}</p>
        <pre>
          {JSON.stringify(
            {
              formSessions,
              backofficeSession,
              issuedCredentials
            },
            null,
            2
          )}
        </pre>
      </section>

      <button onClick={() => resetAppStore()} type="button">
        {t("settingsPage.resetLocalState")}
      </button>
    </main>
  );
}
