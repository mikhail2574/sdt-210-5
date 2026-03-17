"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { FormMessage } from "@/components/atoms/FormMessage";
import { TextInput } from "@/components/atoms/TextInput";
import { FormField } from "@/components/molecules/FormField";
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
      <FormField htmlFor="trackingCode" label={t("customerLogin.trackingCode")}>
        <TextInput id="trackingCode" onChange={(event) => setTrackingCode(event.target.value)} value={trackingCode} />
      </FormField>

      <FormField htmlFor="password" label={t("customerLogin.password")}>
        <TextInput id="password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </FormField>

      {error ? <FormMessage>{t("customerLogin.error")}</FormMessage> : null}

      <Button disabled={loading} type="submit">
        {loading ? t("customerLogin.loading") : t("customerLogin.submit")}
      </Button>
    </form>
  );
}
