"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";

type InviteUserFormProps = {
  tenantId: string;
};

export function InviteUserForm({ tenantId }: InviteUserFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { backoffice } = useFrontendApi();
  const [email, setEmail] = useState("new.user@stadtwerke.demo");
  const [role, setRole] = useState("Sachbearbeitung");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorKey(null);

        try {
          await backoffice.inviteUser(tenantId, {
            email,
            role
          });

          router.refresh();
        } catch {
          setErrorKey("backoffice.actionError");
        }
      }}
    >
      <label htmlFor="invite-email">{t("backoffice.inviteEmail")}</label>
      <input className="field-control" id="invite-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />

      <label htmlFor="invite-role">{t("backoffice.inviteRole")}</label>
      <select className="field-control" id="invite-role" onChange={(event) => setRole(event.target.value)} value={role}>
        <option value="Sachbearbeitung">Sachbearbeitung</option>
        <option value="Admin">Admin</option>
        <option value="Installateur">Installateur</option>
      </select>

      {errorKey ? <p className="field-message">{t(errorKey)}</p> : null}

      <button className="wizard-button" type="submit">
        {t("backoffice.inviteSubmit")}
      </button>
    </form>
  );
}
