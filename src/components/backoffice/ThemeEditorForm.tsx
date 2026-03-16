"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useFrontendApi } from "@/lib/frontend/api-provider";
import type { ThemeConfig } from "@/lib/forms/types";

type ThemeEditorFormProps = {
  tenantId: string;
  theme: ThemeConfig;
};

export function ThemeEditorForm({ tenantId, theme }: ThemeEditorFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { backoffice } = useFrontendApi();
  const [draftTheme, setDraftTheme] = useState(theme);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function patch(path: string, value: string) {
    setDraftTheme((current) => {
      if (path === "primary") {
        return {
          ...current,
          palette: {
            ...current.palette,
            primary: value
          }
        };
      }

      if (path === "secondary") {
        return {
          ...current,
          palette: {
            ...current.palette,
            secondary: value
          }
        };
      }

      if (path === "accent") {
        return {
          ...current,
          palette: {
            ...current.palette,
            accent: value
          }
        };
      }

      if (path === "fontSize") {
        return {
          ...current,
          typography: {
            ...current.typography,
            baseFontSizePx: Number(value)
          }
        };
      }

      return current;
    });
  }

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorKey(null);

        try {
          await backoffice.updateTheme(tenantId, draftTheme);
          router.refresh();
        } catch {
          setErrorKey("backoffice.actionError");
        }
      }}
    >
      <label htmlFor="theme-primary">{t("backoffice.themePrimary")}</label>
      <input className="field-control" id="theme-primary" onChange={(event) => patch("primary", event.target.value)} value={draftTheme.palette.primary} />

      <label htmlFor="theme-secondary">{t("backoffice.themeSecondary")}</label>
      <input className="field-control" id="theme-secondary" onChange={(event) => patch("secondary", event.target.value)} value={draftTheme.palette.secondary} />

      <label htmlFor="theme-accent">{t("backoffice.themeAccent")}</label>
      <input className="field-control" id="theme-accent" onChange={(event) => patch("accent", event.target.value)} value={draftTheme.palette.accent} />

      <label htmlFor="theme-font-size">{t("backoffice.themeFontSize")}</label>
      <input className="field-control" id="theme-font-size" onChange={(event) => patch("fontSize", event.target.value)} type="number" value={draftTheme.typography.baseFontSizePx} />

      {errorKey ? <p className="field-message">{t(errorKey)}</p> : null}

      <button className="wizard-button" type="submit">
        {t("backoffice.themeSubmit")}
      </button>
    </form>
  );
}
