"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePortalApp } from "@/hooks/usePortalApp";
import type { Locale } from "@/lib/i18n";

type CustomerLogoutButtonProps = {
  locale: Locale;
};

export function CustomerLogoutButton({ locale }: CustomerLogoutButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const { customerLogout, loading } = usePortalApp();

  return (
    <button
      onClick={async () => {
        await customerLogout();
        router.push(`/${locale}/login`);
      }}
      disabled={loading}
      type="button"
    >
      {t("customerStatus.logout")}
    </button>
  );
}
