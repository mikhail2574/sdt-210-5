"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePortalApp } from "@/hooks/usePortalApp";
import type { Locale } from "@/lib/i18n";

type CustomerLoginFormProps = {
  locale: Locale;
};

export function CustomerLoginForm({ locale }: CustomerLoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { customerLogin, error, loading } = usePortalApp();
  const [trackingCode, setTrackingCode] = useState("317-000-HA01016");
  const [password, setPassword] = useState("DemoPass!2026");

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();

        try {
          const payload = await customerLogin({
            trackingCode,
            password
          });

          router.push(`/${locale}/applications/${payload.applicationId}`);
        } catch {
        }
      }}
    >
      <label htmlFor="trackingCode">{t("customerLogin.trackingCode")}</label>
      <input className="field-control" id="trackingCode" onChange={(event) => setTrackingCode(event.target.value)} value={trackingCode} />

      <label htmlFor="password">{t("customerLogin.password")}</label>
      <input className="field-control" id="password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />

      {error ? <p className="field-message">{t("customerLogin.error")}</p> : null}

      <button className="wizard-button" disabled={loading} type="submit">
        {loading ? t("customerLogin.loading") : t("customerLogin.submit")}
      </button>
    </form>
  );
}
