"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ErrorSummary } from "@/components/kundenportal/ErrorSummary";
import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { SoftRequiredModal } from "@/components/kundenportal/SoftRequiredModal";
import { isFrontendApiError } from "@/services/api";
import type { ValidationErrorPayload } from "@/lib/frontend/api-contract";
import { usePortalApp } from "@/hooks/usePortalApp";
import { getPreviousWizardPageKey, type PublicWizardPageKey } from "@/lib/demo/public-flow";
import {
  getSoftMissingWizardFields,
  getWizardDefaultValues,
  getWizardPageConfig,
  isWizardFieldVisible,
  type WizardFieldConfig,
  type WizardPageValues
} from "@/lib/demo/public-ui";
import type { ThemeConfig } from "@/lib/forms/types";
import type { Locale } from "@/lib/i18n";
import { useAppStore, useAppStoreHydrated } from "@/lib/state/app-store";

type GenericWizardFormProps = {
  applicationId?: string | null;
  formId: string;
  initialValues?: WizardPageValues;
  locale: Locale;
  pageKey: PublicWizardPageKey;
  theme: ThemeConfig;
};

type ErrorMap = Record<
  string,
  {
    labelKey?: string;
    messageKey: string;
  }
>;

function getFieldBadge(requirement: WizardFieldConfig["requirement"], t: ReturnType<typeof useTranslations>) {
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

export function GenericWizardForm({
  applicationId: initialApplicationId = null,
  formId,
  initialValues,
  locale,
  pageKey,
  theme
}: GenericWizardFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { savePublicPage } = usePortalApp();
  const page = useMemo(() => getWizardPageConfig(pageKey), [pageKey]);
  const hasHydrated = useAppStoreHydrated();
  const saveFormPageDraft = useAppStore((state) => state.saveFormPageDraft);
  const setFormApplicationId = useAppStore((state) => state.setFormApplicationId);
  const [applicationId, setApplicationId] = useState<string | null>(initialApplicationId);
  const [didRestorePersistedState, setDidRestorePersistedState] = useState(false);
  const [values, setValues] = useState<WizardPageValues>(() => getWizardDefaultValues(pageKey, initialValues));
  const [errors, setErrors] = useState<ErrorMap>({});
  const [softMissingIds, setSoftMissingIds] = useState<string[]>([]);
  const [statusKey, setStatusKey] = useState<"wizard.saved" | "wizard.saveError" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<WizardPageValues | null>(null);
  const deferredValues = useDeferredValue(values);

  const visibleFields = useMemo(
    () =>
      page.sections.flatMap((section) =>
        section.fields.filter((field) => isWizardFieldVisible(field, values))
      ),
    [page.sections, values]
  );

  useEffect(() => {
    if (!hasHydrated || didRestorePersistedState) {
      return;
    }

    const persistedSession = useAppStore.getState().formSessions[formId];
    const persistedDraft = persistedSession?.pages[pageKey];
    const persistedApplicationId = persistedSession?.applicationId ?? null;

    if (!initialApplicationId && persistedApplicationId) {
      setApplicationId((current) => current ?? persistedApplicationId);
    }

    if (!persistedDraft) {
      setDidRestorePersistedState(true);
      return;
    }

    setValues((current) => ({
      ...current,
      ...persistedDraft
    }));
    setDidRestorePersistedState(true);
  }, [didRestorePersistedState, formId, hasHydrated, initialApplicationId, pageKey]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveFormPageDraft(formId, pageKey, deferredValues);
  }, [deferredValues, formId, hasHydrated, pageKey, saveFormPageDraft]);

  useEffect(() => {
    setErrors((current) => {
      const next: ErrorMap = {};

      for (const [fieldId, error] of Object.entries(current)) {
        if (visibleFields.some((field) => field.id === fieldId)) {
          next[fieldId] = error;
        }
      }

      return next;
    });
  }, [visibleFields]);

  const errorEntries = Object.entries(errors).map(([fieldId, error]) => ({
    fieldId,
    messageKey: error.messageKey,
    messageText:
      error.messageKey === "validation.requiredField" || error.messageKey === "validation.requiredAttachment"
        ? t(error.messageKey, { field: error.labelKey ? t(error.labelKey) : "" })
        : t(error.messageKey)
  }));

  async function persist(nextValues: WizardPageValues) {
    setIsSaving(true);
    setStatusKey(null);

    try {
      const payload = await savePublicPage({
        applicationId,
        formId,
        pageKey,
        data: nextValues
      });

      const nextSoftMissing = (payload.validation?.softMissing ?? []).map((item) => item.fieldPath.split(".").at(-1) ?? item.fieldPath);

      setApplicationId(payload.applicationId);
      setFormApplicationId(formId, payload.applicationId);
      saveFormPageDraft(formId, pageKey, nextValues);
      setSoftMissingIds(nextSoftMissing);
      setErrors({});
      setStatusKey("wizard.saved");
      router.push(`/${locale}/forms/${formId}/${payload.nextPageKey}?applicationId=${payload.applicationId}`);
    } catch (error) {
      if (isFrontendApiError<ValidationErrorPayload>(error) && error.status === 422 && error.payload?.error?.details) {
        const nextErrors: ErrorMap = {};

        for (const item of error.payload.error.details) {
          const fieldId = item.fieldPath.split(".").at(-1) ?? item.fieldPath;
          nextErrors[fieldId] = {
            labelKey: item.labelKey,
            messageKey: item.messageKey ?? "validation.requiredField"
          };
        }

        setErrors(nextErrors);
        return;
      }

      setStatusKey("wizard.saveError");
    } finally {
      setIsSaving(false);
    }
  }

  const softMissingFields = useMemo(() => getSoftMissingWizardFields(pageKey, values), [pageKey, values]);

  function handleChange(field: WizardFieldConfig, nextValue: unknown) {
    setValues((current) => ({
      ...current,
      [field.id]: nextValue
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field.id];
      return next;
    });
  }

  function handleSubmit() {
    const nextSoftMissing = getSoftMissingWizardFields(pageKey, values);

    if (nextSoftMissing.length > 0) {
      setPendingValues(values);
      setSoftMissingIds(nextSoftMissing.map((field) => field.id));
      setModalOpen(true);
      return;
    }

    void persist(values);
  }

  const previousPageKey = getPreviousWizardPageKey(pageKey);
  const backHref =
    previousPageKey === pageKey
      ? `/${locale}`
      : `/${locale}/forms/${formId}/${previousPageKey}${applicationId ? `?applicationId=${applicationId}` : ""}`;

  return (
    <PortalChrome currentPageKey={pageKey} locale={locale} theme={theme}>
      <h1 className="wizard-page-title">{t(page.titleKey)}</h1>
      <p className="wizard-page-description">{t(page.descriptionKey)}</p>

      <ErrorSummary errors={errorEntries} />

      {statusKey ? (
        <div aria-live="polite" className="wizard-status">
          <p>{t(statusKey)}</p>
        </div>
      ) : null}

      {page.sections.map((section) => (
        <section className="wizard-section" key={section.key}>
          <h2 className="wizard-section-header">{t(section.titleKey)}</h2>
          <div className="wizard-section-body">
            {section.infoKey ? <div className="wizard-info">{t(section.infoKey)}</div> : null}

            {section.fields.map((field) => {
              if (!isWizardFieldVisible(field, values)) {
                return null;
              }

              const fieldError = errors[field.id];
              const fieldMessageId = `${field.id}-message`;
              const hasSoftMissing = softMissingIds.includes(field.id);
              const shellClassName = ["field-shell", fieldError ? "has-error" : "", hasSoftMissing ? "soft-missing" : ""]
                .filter(Boolean)
                .join(" ");

              if (field.type === "checkbox") {
                return (
                  <div className={shellClassName} id={`field-${field.id}`} key={field.id}>
                    <label className="choice-option checkbox-option">
                      <input
                        aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                        checked={values[field.id] === true}
                        onChange={(event) => {
                          handleChange(field, event.target.checked);
                        }}
                        type="checkbox"
                      />
                      <span>
                        {t(field.labelKey)}
                        {getFieldBadge(field.requirement, t)}
                      </span>
                    </label>
                    {field.helpKey ? <p className="field-help">{t(field.helpKey)}</p> : null}
                    {renderFieldMessage(t, fieldError, hasSoftMissing, fieldMessageId)}
                  </div>
                );
              }

              if (field.type === "radio_group" || field.type === "checkbox_group") {
                const currentValue = field.type === "checkbox_group" && Array.isArray(values[field.id]) ? values[field.id] : [];

                return (
                  <div className={shellClassName} id={`field-${field.id}`} key={field.id}>
                    <fieldset aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined} className="choice-group">
                      <legend>
                        {t(field.labelKey)}
                        {getFieldBadge(field.requirement, t)}
                      </legend>
                      {field.helpKey ? <p className="field-help">{t(field.helpKey)}</p> : null}
                      {field.options?.map((option) => (
                        <label className="choice-option" key={option.value}>
                          <input
                            checked={
                              field.type === "radio_group"
                                ? values[field.id] === option.value
                                : Array.isArray(currentValue) && currentValue.includes(option.value)
                            }
                            onChange={(event) => {
                              if (field.type === "radio_group") {
                                handleChange(field, option.value);
                                return;
                              }

                              const nextValues = event.target.checked
                                ? [...(currentValue as string[]), option.value]
                                : (currentValue as string[]).filter((item) => item !== option.value);
                              handleChange(field, nextValues);
                            }}
                            type={field.type === "radio_group" ? "radio" : "checkbox"}
                            value={option.value}
                          />
                          <span>{t(option.labelKey)}</span>
                        </label>
                      ))}
                    </fieldset>
                    {renderFieldMessage(t, fieldError, hasSoftMissing, fieldMessageId)}
                  </div>
                );
              }

              if (field.type === "file_list") {
                const attachments = Array.isArray(values[field.id]) ? (values[field.id] as Array<{ name: string; size: number }>) : [];

                return (
                  <div className={shellClassName} id={`field-${field.id}`} key={field.id}>
                    <label htmlFor={field.id}>
                      {t(field.labelKey)}
                      {getFieldBadge(field.requirement, t)}
                    </label>
                    {field.helpKey ? <p className="field-help">{t(field.helpKey)}</p> : null}
                    <input
                      className="field-control"
                      id={field.id}
                      multiple
                      onChange={(event) => {
                        const nextFiles = Array.from(event.target.files ?? []).map((file) => ({
                          name: file.name,
                          size: file.size,
                          type: file.type
                        }));
                        handleChange(field, nextFiles);
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
                                handleChange(
                                  field,
                                  attachments.filter((item) => item.name !== attachment.name)
                                );
                              }}
                              type="button"
                            >
                              {t("wizard.removeFile")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {renderFieldMessage(t, fieldError, hasSoftMissing, fieldMessageId)}
                  </div>
                );
              }

              return (
                <div className={shellClassName} id={`field-${field.id}`} key={field.id}>
                  <label htmlFor={field.id}>
                    {t(field.labelKey)}
                    {getFieldBadge(field.requirement, t)}
                  </label>
                  {field.helpKey ? <p className="field-help">{t(field.helpKey)}</p> : null}

                  {field.type === "select" ? (
                    <select
                      aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                      className="field-control"
                      id={field.id}
                      onChange={(event) => {
                        handleChange(field, event.target.value);
                      }}
                      value={String(values[field.id] ?? "")}
                    >
                      <option value="">{t("wizard.selectPlaceholder")}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                      className="field-control-textarea"
                      id={field.id}
                      onChange={(event) => {
                        handleChange(field, event.target.value);
                      }}
                      rows={field.rows ?? 4}
                      value={String(values[field.id] ?? "")}
                    />
                  ) : (
                    <input
                      aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                      className="field-control"
                      id={field.id}
                      onChange={(event) => {
                        handleChange(field, event.target.value);
                      }}
                      type={field.type}
                      value={String(values[field.id] ?? "")}
                    />
                  )}

                  {renderFieldMessage(t, fieldError, hasSoftMissing, fieldMessageId)}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="wizard-actions">
        <a className="wizard-button-secondary" href={backHref}>
          {t("wizard.back")}
        </a>
        <button className="wizard-button" disabled={isSaving} onClick={handleSubmit} type="button">
          {isSaving ? t("wizard.saving") : t("wizard.next")}
        </button>
      </div>

      <SoftRequiredModal
        fields={softMissingFields.map((field) => ({
          id: field.id,
          labelKey: field.labelKey
        }))}
        onClose={() => {
          setModalOpen(false);
        }}
        onSkip={() => {
          setModalOpen(false);
          if (pendingValues) {
            void persist(pendingValues);
          }
        }}
        open={modalOpen}
      />
    </PortalChrome>
  );
}

function renderFieldMessage(
  t: ReturnType<typeof useTranslations>,
  fieldError: ErrorMap[string] | undefined,
  hasSoftMissing: boolean,
  fieldMessageId: string
) {
  if (fieldError) {
    return (
      <p aria-live="polite" className="field-message" id={fieldMessageId}>
        {fieldError.messageKey === "validation.requiredField" || fieldError.messageKey === "validation.requiredAttachment"
          ? t(fieldError.messageKey, { field: fieldError.labelKey ? t(fieldError.labelKey) : "" })
          : t(fieldError.messageKey)}
      </p>
    );
  }

  if (hasSoftMissing) {
    return (
      <p aria-live="polite" className="field-message warning" id={fieldMessageId}>
        {t("wizard.softRequired.leaveWarning")}
      </p>
    );
  }

  return null;
}
