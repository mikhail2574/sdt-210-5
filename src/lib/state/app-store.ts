"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type AntragsdetailsFormValues } from "@/lib/forms/types";
import { defaultLocale, type Locale } from "@/lib/i18n";

type FormPageDraft = Partial<AntragsdetailsFormValues>;

type FormSession = {
  applicationId: string | null;
  pages: Record<string, FormPageDraft>;
  updatedAt: string;
};

type AppStoreState = {
  preferredLocale: Locale;
  formSessions: Record<string, FormSession>;
  setPreferredLocale: (locale: Locale) => void;
  saveFormPageDraft: (formId: string, pageKey: string, values: FormPageDraft) => void;
  setFormApplicationId: (formId: string, applicationId: string | null) => void;
  clearFormSession: (formId: string) => void;
};

const initialState = {
  preferredLocale: defaultLocale,
  formSessions: {}
} satisfies Pick<AppStoreState, "preferredLocale" | "formSessions">;

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      ...initialState,
      setPreferredLocale: (locale) => {
        set({ preferredLocale: locale });
      },
      saveFormPageDraft: (formId, pageKey, values) => {
        set((state) => {
          const currentSession = state.formSessions[formId];

          return {
            formSessions: {
              ...state.formSessions,
              [formId]: {
                applicationId: currentSession?.applicationId ?? null,
                pages: {
                  ...currentSession?.pages,
                  [pageKey]: values
                },
                updatedAt: new Date().toISOString()
              }
            }
          };
        });
      },
      setFormApplicationId: (formId, applicationId) => {
        set((state) => {
          const currentSession = state.formSessions[formId];

          return {
            formSessions: {
              ...state.formSessions,
              [formId]: {
                applicationId,
                pages: currentSession?.pages ?? {},
                updatedAt: new Date().toISOString()
              }
            }
          };
        });
      },
      clearFormSession: (formId) => {
        set((state) => {
          const nextSessions = { ...state.formSessions };
          delete nextSessions[formId];

          return {
            formSessions: nextSessions
          };
        });
      }
    }),
    {
      name: "kundenportal-app-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferredLocale: state.preferredLocale,
        formSessions: state.formSessions
      })
    }
  )
);

export function useAppStoreHydrated() {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribeHydrate = useAppStore.persist.onHydrate(() => {
      setHydrated(false);
    });
    const unsubscribeFinish = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useAppStore.persist.hasHydrated());

    return () => {
      unsubscribeHydrate();
      unsubscribeFinish();
    };
  }, []);

  return hydrated;
}

export function resetAppStore() {
  useAppStore.setState(initialState);
  void useAppStore.persist.clearStorage();
}
