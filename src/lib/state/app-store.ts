"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { IssuedCredential, StaffSession } from "@/lib/frontend/api-contract";
import { defaultLocale, type Locale } from "@/lib/i18n";

type FormPageDraft = Record<string, unknown>;

type FormSession = {
  applicationId: string | null;
  pages: Record<string, FormPageDraft>;
  updatedAt: string;
};

type AppStoreState = {
  preferredLocale: Locale;
  formSessions: Record<string, FormSession>;
  backofficeSession: StaffSession | null;
  issuedCredentials: Record<string, IssuedCredential>;
  setPreferredLocale: (locale: Locale) => void;
  saveFormPageDraft: (formId: string, pageKey: string, values: FormPageDraft) => void;
  setFormApplicationId: (formId: string, applicationId: string | null) => void;
  clearFormSession: (formId: string) => void;
  setBackofficeSession: (session: StaffSession | null) => void;
  saveIssuedCredential: (credential: IssuedCredential) => void;
};

const initialState = {
  preferredLocale: defaultLocale,
  formSessions: {},
  backofficeSession: null,
  issuedCredentials: {}
} satisfies Pick<AppStoreState, "preferredLocale" | "formSessions" | "backofficeSession" | "issuedCredentials">;

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
      },
      setBackofficeSession: (session) => {
        set({
          backofficeSession: session
        });
      },
      saveIssuedCredential: (credential) => {
        set((state) => ({
          issuedCredentials: {
            ...state.issuedCredentials,
            [credential.applicationId]: credential
          }
        }));
      }
    }),
    {
      name: "kundenportal-app-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferredLocale: state.preferredLocale,
        formSessions: state.formSessions,
        backofficeSession: state.backofficeSession,
        issuedCredentials: state.issuedCredentials
      })
    }
  )
);

export function useAppStoreHydrated() {
  const persistApi = useAppStore.persist;
  const [hydrated, setHydrated] = useState(persistApi ? persistApi.hasHydrated() : true);

  useEffect(() => {
    if (!persistApi) {
      setHydrated(true);
      return;
    }

    const unsubscribeHydrate = persistApi.onHydrate(() => {
      setHydrated(false);
    });
    const unsubscribeFinish = persistApi.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(persistApi.hasHydrated());

    return () => {
      unsubscribeHydrate();
      unsubscribeFinish();
    };
  }, [persistApi]);

  return hydrated;
}

export function resetAppStore() {
  useAppStore.setState(initialState);
  void useAppStore.persist?.clearStorage();
}
