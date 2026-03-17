"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { AntragsdetailsWizardField } from "@/components/kundenportal/AntragsdetailsWizardField";
import { ErrorSummary } from "@/components/kundenportal/ErrorSummary";
import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { SoftRequiredModal } from "@/components/kundenportal/SoftRequiredModal";
import { type PublicWizardPageKey } from "@/lib/demo/public-flow";
import { usePortalApp } from "@/hooks/usePortalApp";
import { useFormDraftPersistence } from "@/hooks/useFormDraftPersistence";
import { type AntragsdetailsFormValues, type FieldBlock, type FormPage, type ThemeConfig } from "@/lib/forms/types";
import { buildAntragsdetailsSchema, getSoftMissingFields, isFieldVisible, normalizeValues } from "@/lib/forms/validation";
import { type Locale } from "@/lib/i18n";
import { useAppStore, useAppStoreHydrated } from "@/lib/state/app-store";

type AntragsdetailsWizardProps = {
  formId: string;
  locale: Locale;
  page: FormPage;
  theme: ThemeConfig;
  initialApplicationId?: string | null;
  initialValues?: Partial<AntragsdetailsFormValues>;
  onNavigate?: (url: string) => void;
};

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
  const { savePublicPage } = usePortalApp();
  const schema = useMemo(() => buildAntragsdetailsSchema(page), [page]);
  const hasHydrated = useAppStoreHydrated();
  const saveFormPageDraft = useAppStore((state) => state.saveFormPageDraft);
  const setFormApplicationId = useAppStore((state) => state.setFormApplicationId);
  const [isSaving, setIsSaving] = useState(false);
  const [statusKey, setStatusKey] = useState<"wizard.saved" | "wizard.saveError" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [softMissing, setSoftMissing] = useState<FieldBlock[]>([]);
  const [softMissingIds, setSoftMissingIds] = useState<Set<string>>(new Set());
  const [pendingValues, setPendingValues] = useState<AntragsdetailsFormValues | null>(null);
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
  const normalizedDeferredValues = useMemo(() => normalizeValues(deferredValues), [deferredValues]);
  const { applicationId, setApplicationId } = useFormDraftPersistence({
    deferredValues: normalizedDeferredValues,
    formId,
    hasHydrated,
    initialApplicationId,
    mergePersistedDraft: (persistedDraft) =>
      normalizeValues({
        ...initialValues,
        ...persistedDraft
      }),
    onRestore: reset,
    pageKey: page.key
  });
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

  async function persist(valuesToSave: AntragsdetailsFormValues) {
    setIsSaving(true);
    setStatusKey(null);

    try {
      const result = await savePublicPage({
        applicationId,
        formId,
        pageKey: page.key,
        data: valuesToSave
      });

      setApplicationId(result.applicationId);
      setFormApplicationId(formId, result.applicationId);
      saveFormPageDraft(formId, page.key, valuesToSave);
      setStatusKey("wizard.saved");
      navigate(`/${locale}/forms/${formId}/${result.nextPageKey}?applicationId=${result.applicationId}`);
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
      setSoftMissingIds(new Set(nextSoftMissing.map((field) => field.id)));
      setModalOpen(true);
      return;
    }

    setSoftMissingIds(new Set());
    void persist(nextValues);
  };

  return (
    <PortalChrome currentPageKey={page.key as PublicWizardPageKey} locale={locale} theme={theme} title={t(page.titleI18nKey)}>
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

              return (
                <AntragsdetailsWizardField
                  block={block}
                  control={control}
                  error={errors[block.id as keyof AntragsdetailsFormValues]}
                  hasSoftMissing={softMissingIds.has(block.id)}
                  key={block.id}
                  softRequiredWarningKey={page.softRequiredLeaveWarningI18nKey}
                />
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
    </PortalChrome>
  );
}
