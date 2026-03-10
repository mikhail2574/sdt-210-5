import type { CSSProperties } from "react";

import type { ThemeConfig } from "@/lib/forms/types";

export function getThemeVariables(theme: ThemeConfig): CSSProperties {
  return {
    "--tenant-primary": theme.palette.primary,
    "--tenant-secondary": theme.palette.secondary,
    "--tenant-accent": theme.palette.accent,
    "--tenant-bg": theme.palette.bg,
    "--tenant-text": theme.palette.text,
    "--tenant-danger": theme.palette.danger,
    "--tenant-warning": theme.palette.warning,
    "--tenant-font-family": theme.typography.fontFamily,
    "--tenant-font-size": `${theme.typography.baseFontSizePx}px`
  } as CSSProperties;
}
