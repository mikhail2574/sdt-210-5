"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePortalApp } from "@/hooks/usePortalApp";
import type { Locale } from "@/lib/i18n";

type BackofficeLoginFormProps = {
  locale: Locale;
};

export function BackofficeLoginForm({ locale }: BackofficeLoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { error, loading, staffLogin } = usePortalApp();
  const [email, setEmail] = useState("staff@stadtwerke.demo");
  const [password, setPassword] = useState("demo12345");

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();

        try {
          await staffLogin({
            email,
            password
          });
          router.push(`/${locale}/backoffice`);
        } catch {
        }
      }}
    >
      <label htmlFor="staff-email">{t("backoffice.email")}</label>
      <input className="field-control" id="staff-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />

      <label htmlFor="staff-password">{t("backoffice.password")}</label>
      <input className="field-control" id="staff-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />

      {error ? <p className="field-message">{t("backoffice.loginError")}</p> : null}

      <button className="wizard-button" disabled={loading} type="submit">
        {loading ? t("backoffice.loggingIn") : t("backoffice.loginSubmit")}
      </button>
    </form>
  );
}
