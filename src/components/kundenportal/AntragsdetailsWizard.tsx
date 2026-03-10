"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ErrorSummary } from "@/components/kundenportal/ErrorSummary";
import { LanguageSwitcher } from "@/components/kundenportal/LanguageSwitcher";
import { SoftRequiredModal } from "@/components/kundenportal/SoftRequiredModal";
import { type AntragsdetailsFormValues, type FieldBlock, type FormPage, type ThemeConfig } from "@/lib/forms/types";
import { buildAntragsdetailsSchema, getSoftMissingFields, isFieldVisible, normalizeValues } from "@/lib/forms/validation";
import { type Locale } from "@/lib/i18n";
import { useAppStore, useAppStoreHydrated } from "@/lib/state/app-store";
import { getThemeVariables } from "@/lib/theme";

type AntragsdetailsWizardProps = {
  formId: string;
  locale: Locale;
  page: FormPage;
  theme: ThemeConfig;
  initialApplicationId?: string | null;
  initialValues?: Partial<AntragsdetailsFormValues>;
  onNavigate?: (url: string) => void;
};

function getFieldBadge(requirement: FieldBlock["requirement"], t: ReturnType<typeof useTranslations>) {
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

export function AntragsdetailsWizard({
  formId,
  locale,
  page,
  theme,
  initialApplicationId = null,
  initialValues,
  onNavigate
}: AntragsdetailsWizardProps) {
  const t = useTranslations();
  const router = useRouter();
  const navigate = onNavigate ?? router.push;
  const schema = useMemo(() => buildAntragsdetailsSchema(page), [page]);
  const hasHydrated = useAppStoreHydrated();
  const saveFormPageDraft = useAppStore((state) => state.saveFormPageDraft);
  const setFormApplicationId = useAppStore((state) => state.setFormApplicationId);
  const [applicationId, setApplicationId] = useState<string | null>(initialApplicationId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusKey, setStatusKey] = useState<"wizard.saved" | "wizard.saveError" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [softMissing, setSoftMissing] = useState<FieldBlock[]>([]);
  const [softMissingIds, setSoftMissingIds] = useState<string[]>([]);
  const [pendingValues, setPendingValues] = useState<AntragsdetailsFormValues | null>(null);
  const [didRestorePersistedState, setDidRestorePersistedState] = useState(false);
  const {
    control,
    handleSubmit,
    setFocus,
    clearErrors,
    reset,
    formState: { errors },
    watch
  } = useForm<AntragsdetailsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: normalizeValues(initialValues ?? {})
  });

  const values = watch();
  const deferredValues = useDeferredValue(values);
  const errorEntries = Object.entries(errors).map(([fieldId, error]) => ({
    fieldId,
    messageKey: error?.message ?? "wizard.errorSummaryTitle"
  }));

  const visibleFieldIds = useMemo(() => {
    const result = new Set<string>();

    for (const section of page.sections) {
      for (const block of section.blocks) {
        if (block.type === "field" && isFieldVisible(block, values)) {
          result.add(block.id);
        }
      }
    }

    return result;
  }, [page.sections, values]);
  const isChangeKindVisible = visibleFieldIds.has("changeKind");

  useEffect(() => {
    if (!isChangeKindVisible) {
      clearErrors("changeKind");
    }
  }, [clearErrors, isChangeKindVisible]);

  useEffect(() => {
    if (!hasHydrated || didRestorePersistedState) {
      return;
    }

    const persistedSession = useAppStore.getState().formSessions[formId];
    const persistedDraft = persistedSession?.pages[page.key];
    const persistedApplicationId = persistedSession?.applicationId ?? null;

    if (!initialApplicationId && persistedApplicationId) {
      setApplicationId((current) => current ?? persistedApplicationId);
    }

    if (!persistedDraft) {
      setDidRestorePersistedState(true);
      return;
    }

    if (initialApplicationId && persistedApplicationId && initialApplicationId !== persistedApplicationId) {
      setDidRestorePersistedState(true);
      return;
    }

    reset(
      normalizeValues({
        ...initialValues,
        ...persistedDraft
      })
    );
    setDidRestorePersistedState(true);
  }, [didRestorePersistedState, formId, hasHydrated, initialApplicationId, initialValues, page.key, reset]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveFormPageDraft(formId, page.key, normalizeValues(deferredValues));
  }, [deferredValues, formId, hasHydrated, page.key, saveFormPageDraft]);

  async function persist(valuesToSave: AntragsdetailsFormValues) {
    setIsSaving(true);
    setStatusKey(null);

    const isNewDraft = !applicationId;
    const endpoint = isNewDraft
      ? `/api/public/forms/${formId}/applications:draft`
      : `/api/public/applications/${applicationId}/pages/antragsdetails`;
    const method = isNewDraft ? "POST" : "PUT";
    const body = isNewDraft
      ? {
          pageKey: page.key,
          data: valuesToSave
        }
      : {
          data: valuesToSave,
          clientRevision: Date.now()
        };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error("request_failed");
      }

      const result = await response.json();
      const nextApplicationId = result.applicationId ?? applicationId;

      setApplicationId(nextApplicationId);
      setFormApplicationId(formId, nextApplicationId);
      saveFormPageDraft(formId, page.key, valuesToSave);
      setStatusKey("wizard.saved");
      navigate(`/${locale}/forms/${formId}/${result.nextPageKey}?applicationId=${nextApplicationId}`);
    } catch {
      setStatusKey("wizard.saveError");
    } finally {
      setIsSaving(false);
    }
  }

  const onValidSubmit = (nextValues: AntragsdetailsFormValues) => {
    const nextSoftMissing = getSoftMissingFields(page, nextValues);

    if (nextSoftMissing.length > 0) {
      setPendingValues(nextValues);
      setSoftMissing(nextSoftMissing);
      setSoftMissingIds(nextSoftMissing.map((field) => field.id));
      setModalOpen(true);
      return;
    }

    setSoftMissingIds([]);
    void persist(nextValues);
  };

  return (
    <main className="wizard-shell" style={getThemeVariables(theme)}>
      <div className="wizard-container">
        <header className="wizard-header">
          <div className="wizard-brand">
            <img alt={t(theme.logo.altI18nKey)} src={theme.logo.url} />
            <div>
              <p>{t("wizard.headerTitle")}</p>
              <strong>{t(page.titleI18nKey)}</strong>
            </div>
          </div>
          <LanguageSwitcher locale={locale} />
        </header>

        <div className="wizard-panel">
          <h1 className="wizard-page-title">{t(page.titleI18nKey)}</h1>
          <p className="wizard-page-description">{t("forms.hausanschluss.description")}</p>

          <ErrorSummary errors={errorEntries} />

          {statusKey ? (
            <div aria-live="polite" className="wizard-status">
              <p>{t(statusKey)}</p>
            </div>
          ) : null}

          {page.sections.map((section) => (
            <section className="wizard-section" key={section.key}>
              <h2 className="wizard-section-header">{t(section.titleI18nKey)}</h2>
              <div className="wizard-section-body">
                {section.blocks.map((block) => {
                  if (block.type === "info") {
                    return (
                      <div className="wizard-info" key={block.id}>
                        {t(block.contentI18nKey)}
                      </div>
                    );
                  }

                  if (!isFieldVisible(block, values)) {
                    return null;
                  }

                  const fieldError = errors[block.id as keyof AntragsdetailsFormValues];
                  const fieldMessageId = `${block.id}-message`;
                  const hasSoftMissing = softMissingIds.includes(block.id);
                  const shellClassName = ["field-shell", fieldError ? "has-error" : "", hasSoftMissing ? "soft-missing" : ""]
                    .filter(Boolean)
                    .join(" ");

                  if (block.fieldType === "checkbox_group") {
                    return (
                      <div className={shellClassName} id={`field-${block.id}`} key={block.id}>
                        <Controller
                          control={control}
                          name={block.id as keyof AntragsdetailsFormValues}
                          render={({ field }) => (
                            <fieldset aria-describedby={fieldError ? fieldMessageId : undefined} className="choice-group">
                              <legend>
                                {t(block.labelI18nKey)}
                                {getFieldBadge(block.requirement, t)}
                              </legend>
                              {block.options?.map((option) => {
                                const value = Array.isArray(field.value) ? field.value : [];

                                return (
                                  <label className="choice-option" key={option.id}>
                                    <input
                                      checked={value.includes(option.id)}
                                      onChange={(event) => {
                                        const nextValue = event.target.checked ? [...value, option.id] : value.filter((item) => item !== option.id);
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
                        {fieldError ? (
                          <p aria-live="polite" className="field-message" id={fieldMessageId}>
                            {t(fieldError.message!)}
                          </p>
                        ) : hasSoftMissing ? (
                          <p aria-live="polite" className="field-message warning" id={fieldMessageId}>
                            {t("wizard.softRequired.leaveWarning")}
                          </p>
                        ) : null}
                      </div>
                    );
                  }

                  if (block.fieldType === "radio_group") {
                    return (
                      <div className={shellClassName} id={`field-${block.id}`} key={block.id}>
                        <Controller
                          control={control}
                          name={block.id as keyof AntragsdetailsFormValues}
                          render={({ field }) => (
                            <fieldset aria-describedby={fieldError ? fieldMessageId : undefined} className="choice-group">
                              <legend>
                                {t(block.labelI18nKey)}
                                {getFieldBadge(block.requirement, t)}
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
                        {fieldError ? (
                          <p aria-live="polite" className="field-message" id={fieldMessageId}>
                            {t(fieldError.message!)}
                          </p>
                        ) : hasSoftMissing ? (
                          <p aria-live="polite" className="field-message warning" id={fieldMessageId}>
                            {t("wizard.softRequired.leaveWarning")}
                          </p>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div className={shellClassName} id={`field-${block.id}`} key={block.id}>
                      <label htmlFor={block.id}>
                        {t(block.labelI18nKey)}
                        {getFieldBadge(block.requirement, t)}
                      </label>
                      {block.helpTextI18nKey ? <p className="field-help">{t(block.helpTextI18nKey)}</p> : null}
                      <Controller
                        control={control}
                        name={block.id as keyof AntragsdetailsFormValues}
                        render={({ field }) => {
                          if (block.fieldType === "select") {
                            return (
                              <select
                                {...field}
                                aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                                className="field-control"
                                id={block.id}
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
                                aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                                className="field-control-textarea"
                                id={block.id}
                                rows={block.ui?.rows ?? 4}
                              />
                            );
                          }

                          return (
                            <input
                              {...field}
                              aria-describedby={fieldError || hasSoftMissing ? fieldMessageId : undefined}
                              className="field-control"
                              id={block.id}
                              type={block.fieldType}
                            />
                          );
                        }}
                      />
                      {fieldError ? (
                        <p aria-live="polite" className="field-message" id={fieldMessageId}>
                          {t(fieldError.message!)}
                        </p>
                      ) : hasSoftMissing ? (
                        <p aria-live="polite" className="field-message warning" id={fieldMessageId}>
                          {t("wizard.softRequired.leaveWarning")}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="wizard-actions">
            <button className="wizard-button" disabled={isSaving} onClick={handleSubmit(onValidSubmit)} type="button">
              {isSaving ? t("wizard.saving") : t("wizard.next")}
            </button>
          </div>
        </div>

        <SoftRequiredModal
          fields={softMissing}
          onClose={() => {
            setModalOpen(false);
            if (softMissing[0]) {
              setFocus(softMissing[0].id as keyof AntragsdetailsFormValues);
            }
          }}
          onSkip={() => {
            setModalOpen(false);
            if (pendingValues) {
              void persist(pendingValues);
            }
          }}
          open={modalOpen}
        />
      </div>
    </main>
  );
}
