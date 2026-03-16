"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";
import type { Locale } from "@/lib/i18n";

type CustomerLoginFormProps = {
  locale: Locale;
};

export function CustomerLoginForm({ locale }: CustomerLoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { customerAuth } = useFrontendApi();
  const [trackingCode, setTrackingCode] = useState("317-000-HA01016");
  const [password, setPassword] = useState("DemoPass!2026");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorKey(null);

        try {
          const payload = await customerAuth.login({
            trackingCode,
            password
          });

          router.push(`/${locale}/applications/${payload.applicationId}`);
        } catch {
          setErrorKey("customerLogin.error");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <label htmlFor="trackingCode">{t("customerLogin.trackingCode")}</label>
      <input className="field-control" id="trackingCode" onChange={(event) => setTrackingCode(event.target.value)} value={trackingCode} />

      <label htmlFor="password">{t("customerLogin.password")}</label>
      <input className="field-control" id="password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />

      {errorKey ? <p className="field-message">{t(errorKey)}</p> : null}

      <button className="wizard-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? t("customerLogin.loading") : t("customerLogin.submit")}
      </button>
    </form>
  );
}
