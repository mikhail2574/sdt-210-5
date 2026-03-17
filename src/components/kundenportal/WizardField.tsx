"use client";

import { useTranslations } from "next-intl";

import { WizardFieldBadge } from "@/components/kundenportal/WizardFieldBadge";
import { WizardFieldMessage, type WizardFieldMessageError } from "@/components/kundenportal/WizardFieldMessage";
import type { WizardFieldConfig } from "@/lib/demo/public-ui";

type Attachment = {
  name: string;
  size: number;
  type?: string;
};

type WizardFieldProps = {
  config: WizardFieldConfig;
  error?: WizardFieldMessageError;
  hasSoftMissing: boolean;
  onChange: (value: unknown) => void;
  softRequiredWarningKey: string;
  value: unknown;
};

export function WizardField({ config, error, hasSoftMissing, onChange, softRequiredWarningKey, value }: WizardFieldProps) {
  const t = useTranslations();
  const fieldMessageId = `${config.id}-message`;
  const describedBy = error || hasSoftMissing ? fieldMessageId : undefined;
  const shellClassName = ["field-shell", error ? "has-error" : "", hasSoftMissing ? "soft-missing" : ""].filter(Boolean).join(" ");

  if (config.type === "checkbox") {
    return (
      <div className={shellClassName} id={`field-${config.id}`}>
        <label className="choice-option checkbox-option">
          <input
            aria-describedby={describedBy}
            checked={value === true}
            onChange={(event) => {
              onChange(event.target.checked);
            }}
            type="checkbox"
          />
          <span>
            {t(config.labelKey)}
            <WizardFieldBadge requirement={config.requirement} />
          </span>
        </label>
        {config.helpKey ? <p className="field-help">{t(config.helpKey)}</p> : null}
        <WizardFieldMessage error={error} fieldMessageId={fieldMessageId} hasSoftMissing={hasSoftMissing} softRequiredWarningKey={softRequiredWarningKey} />
      </div>
    );
  }

  if (config.type === "radio_group" || config.type === "checkbox_group") {
    const currentValue = config.type === "checkbox_group" && Array.isArray(value) ? value : [];

    return (
      <div className={shellClassName} id={`field-${config.id}`}>
        <fieldset aria-describedby={describedBy} className="choice-group">
          <legend>
            {t(config.labelKey)}
            <WizardFieldBadge requirement={config.requirement} />
          </legend>
          {config.helpKey ? <p className="field-help">{t(config.helpKey)}</p> : null}
          {config.options?.map((option) => (
            <label className="choice-option" key={option.value}>
              <input
                checked={
                  config.type === "radio_group"
                    ? value === option.value
                    : Array.isArray(currentValue) && currentValue.includes(option.value)
                }
                onChange={(event) => {
                  if (config.type === "radio_group") {
                    onChange(option.value);
                    return;
                  }

                  const nextValues = event.target.checked
                    ? [...(currentValue as string[]), option.value]
                    : (currentValue as string[]).filter((item) => item !== option.value);
                  onChange(nextValues);
                }}
                type={config.type === "radio_group" ? "radio" : "checkbox"}
                value={option.value}
              />
              <span>{t(option.labelKey)}</span>
            </label>
          ))}
        </fieldset>
        <WizardFieldMessage error={error} fieldMessageId={fieldMessageId} hasSoftMissing={hasSoftMissing} softRequiredWarningKey={softRequiredWarningKey} />
      </div>
    );
  }

  if (config.type === "file_list") {
    const attachments = Array.isArray(value) ? (value as Attachment[]) : [];

    return (
      <div className={shellClassName} id={`field-${config.id}`}>
        <label htmlFor={config.id}>
          {t(config.labelKey)}
          <WizardFieldBadge requirement={config.requirement} />
        </label>
        {config.helpKey ? <p className="field-help">{t(config.helpKey)}</p> : null}
        <input
          aria-describedby={describedBy}
          className="field-control"
          id={config.id}
          multiple
          onChange={(event) => {
            const nextFiles = Array.from(event.target.files ?? []).map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type
            }));
            onChange(nextFiles);
          }}
          type="file"
        />
        {attachments.length > 0 ? (
          <ul className="upload-list">
            {attachments.map((attachment) => (
              <li key={attachment.name}>
                <span>{attachment.name}</span>
                <button
                  className="inline-link"
                  onClick={() => {
                    onChange(attachments.filter((item) => item.name !== attachment.name));
                  }}
                  type="button"
                >
                  {t("wizard.removeFile")}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <WizardFieldMessage error={error} fieldMessageId={fieldMessageId} hasSoftMissing={hasSoftMissing} softRequiredWarningKey={softRequiredWarningKey} />
      </div>
    );
  }

  return (
    <div className={shellClassName} id={`field-${config.id}`}>
      <label htmlFor={config.id}>
        {t(config.labelKey)}
        <WizardFieldBadge requirement={config.requirement} />
      </label>
      {config.helpKey ? <p className="field-help">{t(config.helpKey)}</p> : null}

      {config.type === "select" ? (
        <select
          aria-describedby={describedBy}
          className="field-control"
          id={config.id}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          value={String(value ?? "")}
        >
          <option value="">{t("wizard.selectPlaceholder")}</option>
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      ) : config.type === "textarea" ? (
        <textarea
          aria-describedby={describedBy}
          className="field-control-textarea"
          id={config.id}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          rows={config.rows ?? 4}
          value={String(value ?? "")}
        />
      ) : (
        <input
          aria-describedby={describedBy}
          className="field-control"
          id={config.id}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          type={config.type}
          value={String(value ?? "")}
        />
      )}

      <WizardFieldMessage error={error} fieldMessageId={fieldMessageId} hasSoftMissing={hasSoftMissing} softRequiredWarningKey={softRequiredWarningKey} />
    </div>
  );
}
