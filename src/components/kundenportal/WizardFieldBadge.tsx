"use client";

import { useTranslations } from "next-intl";

import type { Requirement } from "@/lib/forms/types";

type WizardFieldBadgeProps = {
  requirement: Requirement;
};

export function WizardFieldBadge({ requirement }: WizardFieldBadgeProps) {
  const t = useTranslations();

  if (requirement === "required") {
    return (
      <span className="field-badge required" data-testid="required-badge">
        {t("wizard.requiredBadge")}
      </span>
    );
  }

  if (requirement === "soft_required") {
    return (
      <span className="field-badge soft_required" data-testid="soft-required-badge">
        {t("wizard.softRequiredBadge")}
      </span>
    );
  }

  return null;
}
