"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import type { FieldBlock } from "@/lib/forms/types";

type SoftRequiredModalProps = {
  fields: Array<FieldBlock | { id: string; labelKey: string }>;
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
};

export function SoftRequiredModal({ fields, open, onClose, onSkip }: SoftRequiredModalProps) {
  const t = useTranslations();
  const fillButtonRef = useRef<HTMLButtonElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const focusableButtons = useMemo(() => [fillButtonRef, skipButtonRef], []);

  useEffect(() => {
    if (!open) {
      return;
    }

    fillButtonRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="wizard-modal-backdrop"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
          return;
        }

        if (event.key !== "Tab") {
          return;
        }

        const currentIndex = focusableButtons.findIndex((buttonRef) => buttonRef.current === document.activeElement);

        if (currentIndex === -1) {
          return;
        }

        event.preventDefault();
        const nextIndex = event.shiftKey ? (currentIndex - 1 + focusableButtons.length) % focusableButtons.length : (currentIndex + 1) % focusableButtons.length;
        focusableButtons[nextIndex].current?.focus();
      }}
    >
      <div aria-modal="true" className="wizard-modal" role="dialog" aria-labelledby="soft-required-title">
        <h2 id="soft-required-title">{t("wizard.softRequired.title")}</h2>
        <p>{t("wizard.softRequired.description")}</p>
        <ul>
          {fields.map((field) => (
            <li key={field.id}>{t("labelI18nKey" in field ? field.labelI18nKey : field.labelKey)}</li>
          ))}
        </ul>
        <div className="wizard-modal-actions">
          <button className="wizard-button-secondary" onClick={onClose} ref={fillButtonRef} type="button">
            {t("wizard.softRequired.fillNow")}
          </button>
          <button className="wizard-button" onClick={onSkip} ref={skipButtonRef} type="button">
            {t("wizard.softRequired.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
