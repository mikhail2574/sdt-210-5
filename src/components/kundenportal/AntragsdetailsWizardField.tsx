"use client";

import { useTranslations } from "next-intl";
import { Controller, type Control, type Path } from "react-hook-form";

import { WizardFieldBadge } from "@/components/kundenportal/WizardFieldBadge";
import { WizardFieldMessage } from "@/components/kundenportal/WizardFieldMessage";
import type { AntragsdetailsFormValues, FieldBlock } from "@/lib/forms/types";

type AntragsdetailsWizardFieldProps = {
  block: FieldBlock;
  control: Control<AntragsdetailsFormValues>;
  error?: {
    message?: string;
  };
  hasSoftMissing: boolean;
  softRequiredWarningKey: string;
};

export function AntragsdetailsWizardField({
  block,
  control,
  error,
  hasSoftMissing,
  softRequiredWarningKey
}: AntragsdetailsWizardFieldProps) {
  const t = useTranslations();
  const fieldMessageId = `${block.id}-message`;
  const describedBy = error || hasSoftMissing ? fieldMessageId : undefined;
  const shellClassName = ["field-shell", error ? "has-error" : "", hasSoftMissing ? "soft-missing" : ""].filter(Boolean).join(" ");
  const name = block.id as Path<AntragsdetailsFormValues>;

  return (
    <div className={shellClassName} id={`field-${block.id}`}>
      {block.fieldType === "checkbox_group" ? (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <fieldset aria-describedby={describedBy} className="choice-group">
              <legend>
                {t(block.labelI18nKey)}
                <WizardFieldBadge requirement={block.requirement} />
              </legend>
              {block.options?.map((option) => {
                const currentValue = Array.isArray(field.value) ? field.value : [];

                return (
                  <label className="choice-option" key={option.id}>
                    <input
                      checked={currentValue.includes(option.id)}
                      onChange={(event) => {
                        const nextValue = event.target.checked
                          ? [...currentValue, option.id]
                          : currentValue.filter((item) => item !== option.id);
                        field.onChange(nextValue);
                      }}
                      type="checkbox"
                      value={option.id}
                    />
                    <span>{t(option.labelI18nKey)}</span>
                  </label>
                );
              })}
            </fieldset>
          )}
        />
      ) : block.fieldType === "radio_group" ? (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <fieldset aria-describedby={describedBy} className="choice-group">
              <legend>
                {t(block.labelI18nKey)}
                <WizardFieldBadge requirement={block.requirement} />
              </legend>
              {block.options?.map((option) => (
                <label className="choice-option" key={option.id}>
                  <input checked={field.value === option.id} onChange={() => field.onChange(option.id)} type="radio" value={option.id} />
                  <span>{t(option.labelI18nKey)}</span>
                </label>
              ))}
            </fieldset>
          )}
        />
      ) : (
        <>
          <label htmlFor={block.id}>
            {t(block.labelI18nKey)}
            <WizardFieldBadge requirement={block.requirement} />
          </label>
          {block.helpTextI18nKey ? <p className="field-help">{t(block.helpTextI18nKey)}</p> : null}
          <Controller
            control={control}
            name={name}
            render={({ field }) => {
              if (block.fieldType === "select") {
                return (
                  <select
                    {...field}
                    aria-describedby={describedBy}
                    className="field-control"
                    id={block.id}
                    value={field.value ?? ""}
                  >
                    <option value="">{t("wizard.selectPlaceholder")}</option>
                    {block.options?.map((option) => (
                      <option key={option.id} value={option.id}>
                        {t(option.labelI18nKey)}
                      </option>
                    ))}
                  </select>
                );
              }

              if (block.fieldType === "textarea") {
                return (
                  <textarea
                    {...field}
                    aria-describedby={describedBy}
                    className="field-control-textarea"
                    id={block.id}
                    rows={block.ui?.rows ?? 4}
                    value={field.value ?? ""}
                  />
                );
              }

              return (
                <input
                  {...field}
                  aria-describedby={describedBy}
                  className="field-control"
                  id={block.id}
                  type={block.fieldType}
                  value={field.value ?? ""}
                />
              );
            }}
          />
        </>
      )}
      <WizardFieldMessage
        error={error?.message ? { messageKey: error.message } : undefined}
        fieldMessageId={fieldMessageId}
        hasSoftMissing={hasSoftMissing}
        softRequiredWarningKey={softRequiredWarningKey}
      />
    </div>
  );
}
