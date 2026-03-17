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

type AcceptInvitationFormProps = {
  inviteId: string;
  locale: Locale;
};

export function AcceptInvitationForm({ inviteId, locale }: AcceptInvitationFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { acceptInvitation, error, loading } = usePortalApp();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();

        try {
          await acceptInvitation(inviteId, {
            displayName,
            password
          });
          router.push(`/${locale}/backoffice`);
        } catch {}
      }}
    >
      <FormField htmlFor="invite-display-name" label={t("invitationAccept.displayName")}>
        <TextInput id="invite-display-name" onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
      </FormField>

      <FormField htmlFor="invite-password" label={t("invitationAccept.password")}>
        <TextInput id="invite-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </FormField>

      {error ? <FormMessage>{error}</FormMessage> : null}

      <Button disabled={loading} type="submit">
        {loading ? t("invitationAccept.submitting") : t("invitationAccept.submit")}
      </Button>
    </form>
  );
}
