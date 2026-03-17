"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { useAppStore } from "@/lib/state/app-store";

// Restores a page draft from the persisted app store after hydration and keeps
// the current page values synced back into that store as they change.
type UseFormDraftPersistenceOptions<TValues extends Record<string, unknown>> = {
  deferredValues: TValues;
  formId: string;
  hasHydrated: boolean;
  initialApplicationId?: string | null;
  mergePersistedDraft: (persistedDraft: Record<string, unknown>) => TValues;
  onRestore: (values: TValues) => void;
  pageKey: string;
};

export function useFormDraftPersistence<TValues extends Record<string, unknown>>({
  deferredValues,
  formId,
  hasHydrated,
  initialApplicationId = null,
  mergePersistedDraft,
  onRestore,
  pageKey
}: UseFormDraftPersistenceOptions<TValues>) {
  const saveFormPageDraft = useAppStore((state) => state.saveFormPageDraft);
  const [applicationId, setApplicationId] = useState<string | null>(initialApplicationId);
  const [didRestorePersistedState, setDidRestorePersistedState] = useState(false);
  const restoreValues = useEffectEvent(onRestore);
  const getMergedPersistedDraft = useEffectEvent(mergePersistedDraft);

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

    if (initialApplicationId && persistedApplicationId && initialApplicationId !== persistedApplicationId) {
      setDidRestorePersistedState(true);
      return;
    }

    restoreValues(getMergedPersistedDraft(persistedDraft));
    setDidRestorePersistedState(true);
  }, [didRestorePersistedState, formId, hasHydrated, initialApplicationId, pageKey, getMergedPersistedDraft, restoreValues]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveFormPageDraft(formId, pageKey, deferredValues);
  }, [deferredValues, formId, hasHydrated, pageKey, saveFormPageDraft]);

  return {
    applicationId,
    setApplicationId
  };
}
