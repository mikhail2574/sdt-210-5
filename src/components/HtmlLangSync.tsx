"use client";

import { useEffect } from "react";

import { isLocale } from "@/lib/i18n";
import { useAppStore } from "@/lib/state/app-store";

type HtmlLangSyncProps = {
  locale: string;
};

export function HtmlLangSync({ locale }: HtmlLangSyncProps) {
  const setPreferredLocale = useAppStore((state) => state.setPreferredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;

    if (isLocale(locale)) {
      setPreferredLocale(locale);
    }
  }, [locale, setPreferredLocale]);

  return null;
}
