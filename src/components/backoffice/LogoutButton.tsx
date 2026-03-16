"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";
import { useAppStore } from "@/lib/state/app-store";
import type { Locale } from "@/lib/i18n";

type LogoutButtonProps = {
  locale: Locale;
};

export function LogoutButton({ locale }: LogoutButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const { staffAuth } = useFrontendApi();
  const setBackofficeSession = useAppStore((state) => state.setBackofficeSession);

  return (
    <button
      className="secondary-button"
      onClick={async () => {
        await staffAuth.logout();
        setBackofficeSession(null);
        router.push(`/${locale}/backoffice/login`);
      }}
      type="button"
    >
      {t("backoffice.logout")}
    </button>
  );
}
