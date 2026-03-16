"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

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

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();

        try {
          await inviteUser(tenantId, {
            email,
            role
          });

          router.refresh();
        } catch {}
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

      {error ? <p className="field-message">{t("backoffice.actionError")}</p> : null}

      <button className="wizard-button" disabled={loading} type="submit">
        {t("backoffice.inviteSubmit")}
      </button>
    </form>
  );
}
