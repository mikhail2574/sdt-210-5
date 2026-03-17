"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { FormMessage } from "@/components/atoms/FormMessage";
import { SelectInput } from "@/components/atoms/SelectInput";
import { TextInput } from "@/components/atoms/TextInput";
import { FormField } from "@/components/molecules/FormField";
import { usePortalApp } from "@/hooks/usePortalApp";

type InviteUserFormProps = {
  tenantId: string;
};

export function InviteUserForm({ tenantId }: InviteUserFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { error, inviteUser, loading } = usePortalApp();
  const [email, setEmail] = useState("new.user@stadtwerke.demo");
  const [role, setRole] = useState("Sachbearbeitung");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSuccessMessage(null);

        try {
          await inviteUser(tenantId, {
            email,
            role
          });

          setSuccessMessage(t("backoffice.inviteSent", { email }));
          router.refresh();
        } catch {}
      }}
    >
      <FormField htmlFor="invite-email" label={t("backoffice.inviteEmail")}>
        <TextInput id="invite-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </FormField>

      <FormField htmlFor="invite-role" label={t("backoffice.inviteRole")}>
        <SelectInput id="invite-role" onChange={(event) => setRole(event.target.value)} value={role}>
          <option value="Sachbearbeitung">Sachbearbeitung</option>
          <option value="Admin">Admin</option>
          <option value="Installateur">Installateur</option>
        </SelectInput>
      </FormField>

      {error ? <FormMessage>{error}</FormMessage> : null}
      {successMessage ? <FormMessage tone="success">{successMessage}</FormMessage> : null}

      <Button disabled={loading} type="submit">
        {t("backoffice.inviteSubmit")}
      </Button>
    </form>
  );
}
