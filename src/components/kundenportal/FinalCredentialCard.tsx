"use client";

import { useTranslations } from "next-intl";

import { useAppStore, useAppStoreHydrated } from "@/lib/state/app-store";

type FinalCredentialCardProps = {
  applicationId: string;
  trackingCode: string;
};

export function FinalCredentialCard({ applicationId, trackingCode }: FinalCredentialCardProps) {
  const t = useTranslations();
  const hydrated = useAppStoreHydrated();
  const credential = useAppStore((state) => state.issuedCredentials[applicationId]);

  return (
    <div className="credential-card">
      <div>
        <p>{t("finalPage.trackingCode")}</p>
        <strong>{credential?.trackingCode ?? trackingCode}</strong>
      </div>
      <div>
        <p>{t("finalPage.password")}</p>
        <strong>{hydrated ? credential?.password ?? t("finalPage.passwordUnavailable") : "…"}</strong>
      </div>
    </div>
  );
}
