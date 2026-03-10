import { describe, expect, it } from "vitest";

import { useAppStore } from "@/lib/state/app-store";

describe("app state store", () => {
  it("persists locale preference and form session data", () => {
    useAppStore.getState().setPreferredLocale("en");
    useAppStore.getState().saveFormPageDraft("hausanschluss-demo", "antragsdetails", {
      selectedMedia: ["strom"],
      wunschtermin: "2026-03-20"
    });
    useAppStore.getState().setFormApplicationId("hausanschluss-demo", "app-123");

    expect(useAppStore.getState().preferredLocale).toBe("en");
    expect(useAppStore.getState().formSessions["hausanschluss-demo"]).toMatchObject({
      applicationId: "app-123",
      pages: {
        antragsdetails: {
          selectedMedia: ["strom"],
          wunschtermin: "2026-03-20"
        }
      }
    });

    const persistedState = localStorage.getItem("kundenportal-app-state");
    expect(persistedState).not.toBeNull();

    const parsedState = JSON.parse(persistedState!);
    expect(parsedState.state.preferredLocale).toBe("en");
    expect(parsedState.state.formSessions["hausanschluss-demo"].applicationId).toBe("app-123");
  });
});
