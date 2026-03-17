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
      <FormField htmlFor="staff-email" label={t("backoffice.email")}>
        <TextInput id="staff-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </FormField>

      <FormField htmlFor="staff-password" label={t("backoffice.password")}>
        <TextInput id="staff-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </FormField>

      {error ? <FormMessage>{t("backoffice.loginError")}</FormMessage> : null}

      <Button disabled={loading} type="submit">
        {loading ? t("backoffice.loggingIn") : t("backoffice.loginSubmit")}
      </Button>
    </form>
  );
}
