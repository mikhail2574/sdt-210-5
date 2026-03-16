"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";
import type { Locale } from "@/lib/i18n";
import { useAppStore } from "@/lib/state/app-store";

type BackofficeLoginFormProps = {
  locale: Locale;
};

export function BackofficeLoginForm({ locale }: BackofficeLoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { staffAuth } = useFrontendApi();
  const setBackofficeSession = useAppStore((state) => state.setBackofficeSession);
  const [email, setEmail] = useState("staff@stadtwerke.demo");
  const [password, setPassword] = useState("demo12345");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorKey(null);
        setIsSubmitting(true);

        try {
          const session = await staffAuth.login({
            email,
            password
          });

          setBackofficeSession(session);
          router.push(`/${locale}/backoffice`);
        } catch {
          setErrorKey("backoffice.loginError");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <label htmlFor="staff-email">{t("backoffice.email")}</label>
      <input className="field-control" id="staff-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />

      <label htmlFor="staff-password">{t("backoffice.password")}</label>
      <input className="field-control" id="staff-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />

      {errorKey ? <p className="field-message">{t(errorKey)}</p> : null}

      <button className="wizard-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? t("backoffice.loggingIn") : t("backoffice.loginSubmit")}
      </button>
    </form>
  );
}
