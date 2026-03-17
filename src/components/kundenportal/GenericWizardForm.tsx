"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ErrorSummary } from "@/components/kundenportal/ErrorSummary";
import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { SoftRequiredModal } from "@/components/kundenportal/SoftRequiredModal";
import { WizardField } from "@/components/kundenportal/WizardField";
import { isFrontendApiError } from "@/services/api";
import type { ValidationErrorPayload } from "@/lib/frontend/api-contract";
import { usePortalApp } from "@/hooks/usePortalApp";
import { useFormDraftPersistence } from "@/hooks/useFormDraftPersistence";
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
  const [values, setValues] = useState<WizardPageValues>(() => getWizardDefaultValues(pageKey, initialValues));
  const [errors, setErrors] = useState<ErrorMap>({});
  const [softMissingIds, setSoftMissingIds] = useState<Set<string>>(new Set());
  const [statusKey, setStatusKey] = useState<"wizard.saved" | "wizard.saveError" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<WizardPageValues | null>(null);
  const deferredValues = useDeferredValue(values);
  const { applicationId, setApplicationId } = useFormDraftPersistence({
    deferredValues,
    formId,
    hasHydrated,
    initialApplicationId,
    mergePersistedDraft: (persistedDraft) => getWizardDefaultValues(pageKey, { ...initialValues, ...persistedDraft }),
    onRestore: setValues,
    pageKey
  });

  const visibleFields = useMemo(
    () =>
      page.sections.flatMap((section) =>
        section.fields.filter((field) => isWizardFieldVisible(field, values))
      ),
    [page.sections, values]
  );

  useEffect(() => {
    const visibleFieldIdSet = new Set(visibleFields.map((field) => field.id));

    setErrors((current) => {
      const next: ErrorMap = {};

      for (const [fieldId, error] of Object.entries(current)) {
        if (visibleFieldIdSet.has(fieldId)) {
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
      setSoftMissingIds(new Set(nextSoftMissing));
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
      setSoftMissingIds(new Set(nextSoftMissing.map((field) => field.id)));
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

              return (
                <WizardField
                  config={field}
                  error={errors[field.id]}
                  hasSoftMissing={softMissingIds.has(field.id)}
                  key={field.id}
                  onChange={(nextValue) => handleChange(field, nextValue)}
                  softRequiredWarningKey="wizard.softRequired.leaveWarning"
                  value={values[field.id]}
                />
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
