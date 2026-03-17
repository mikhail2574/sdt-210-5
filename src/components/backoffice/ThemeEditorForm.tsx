"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { FormMessage } from "@/components/atoms/FormMessage";
import { TextInput } from "@/components/atoms/TextInput";
import { FormField } from "@/components/molecules/FormField";
import { usePortalApp } from "@/hooks/usePortalApp";
import type { ThemeConfig } from "@/lib/forms/types";

type ThemeEditorFormProps = {
  tenantId: string;
  theme: ThemeConfig;
};

export function ThemeEditorForm({ tenantId, theme }: ThemeEditorFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { error, loading, updateTheme } = usePortalApp();
  const [draftTheme, setDraftTheme] = useState(theme);

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

        try {
          await updateTheme(tenantId, draftTheme);
          router.refresh();
        } catch {}
      }}
    >
      <FormField htmlFor="theme-primary" label={t("backoffice.themePrimary")}>
        <TextInput id="theme-primary" onChange={(event) => patch("primary", event.target.value)} value={draftTheme.palette.primary} />
      </FormField>

      <FormField htmlFor="theme-secondary" label={t("backoffice.themeSecondary")}>
        <TextInput id="theme-secondary" onChange={(event) => patch("secondary", event.target.value)} value={draftTheme.palette.secondary} />
      </FormField>

      <FormField htmlFor="theme-accent" label={t("backoffice.themeAccent")}>
        <TextInput id="theme-accent" onChange={(event) => patch("accent", event.target.value)} value={draftTheme.palette.accent} />
      </FormField>

      <FormField htmlFor="theme-font-size" label={t("backoffice.themeFontSize")}>
        <TextInput id="theme-font-size" onChange={(event) => patch("fontSize", event.target.value)} type="number" value={draftTheme.typography.baseFontSizePx} />
      </FormField>

      {error ? <FormMessage>{t("backoffice.actionError")}</FormMessage> : null}

      <Button disabled={loading} type="submit">
        {t("backoffice.themeSubmit")}
      </Button>
    </form>
  );
}
