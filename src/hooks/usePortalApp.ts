"use client";

import { useState } from "react";

import type {
  AcceptInvitationInput,
  CustomerLoginInput,
  InviteUserInput,
  SavePublicApplicationPageInput,
  SaveStaffPageEditsInput,
  ScheduleAppointmentInput,
  StaffLoginInput,
  SubmitPublicApplicationInput,
  TransitionApplicationInput
} from "@/lib/frontend/api-contract";
import { appApi } from "@/services/api";
import { authService } from "@/services/auth";
import { useAppStore } from "@/lib/state/app-store";

type OcrDemoInput = {
  fileName: string;
  sourceText: string;
};

export function usePortalApp() {
  const setBackofficeSession = useAppStore((state) => state.setBackofficeSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction<TResult>(action: () => Promise<TResult>) {
    setLoading(true);
    setError(null);

    try {
      return await action();
    } catch (caughtError) {
      setError(resolveActionError(caughtError));
      throw caughtError;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    clearError() {
      setError(null);
    },
    customerLogin(input: CustomerLoginInput) {
      return runAction(() => authService.signInCustomer(input));
    },
    customerLogout() {
      return runAction(() => authService.signOutCustomer());
    },
    staffLogin(input: StaffLoginInput) {
      return runAction(async () => {
        const session = await authService.signInStaff(input);
        setBackofficeSession(session);
        return session;
      });
    },
    acceptInvitation(inviteId: string, input: AcceptInvitationInput) {
      return runAction(async () => {
        const session = await authService.acceptInvitation(inviteId, input);
        setBackofficeSession(session);
        return session;
      });
    },
    staffLogout() {
      return runAction(async () => {
        await authService.signOutStaff();
        setBackofficeSession(null);
      });
    },
    savePublicPage(input: SavePublicApplicationPageInput) {
      return runAction(() => appApi.publicApplications.savePage(input));
    },
    submitPublicApplication(applicationId: string, input: SubmitPublicApplicationInput) {
      return runAction(() => appApi.publicApplications.submitApplication(applicationId, input));
    },
    inviteUser(tenantId: string, input: InviteUserInput) {
      return runAction(() => appApi.backoffice.inviteUser(tenantId, input));
    },
    updateTheme(tenantId: string, theme: Parameters<typeof appApi.backoffice.updateTheme>[1]) {
      return runAction(() => appApi.backoffice.updateTheme(tenantId, theme));
    },
    updateFormOverride(tenantId: string, formId: string, operations: Parameters<typeof appApi.backoffice.updateFormOverride>[2]) {
      return runAction(() => appApi.backoffice.updateFormOverride(tenantId, formId, operations));
    },
    markApplicationRead(tenantId: string, applicationId: string) {
      return runAction(() => appApi.backoffice.markApplicationRead(tenantId, applicationId));
    },
    transitionApplication(tenantId: string, applicationId: string, input: TransitionApplicationInput) {
      return runAction(() => appApi.backoffice.transitionApplication(tenantId, applicationId, input));
    },
    scheduleAppointment(tenantId: string, applicationId: string, input: ScheduleAppointmentInput) {
      return runAction(() => appApi.backoffice.scheduleAppointment(tenantId, applicationId, input));
    },
    saveApplicationEdits(tenantId: string, applicationId: string, pageKey: string, input: SaveStaffPageEditsInput) {
      return runAction(() => appApi.backoffice.saveApplicationEdits(tenantId, applicationId, pageKey, input));
    },
    runOcrDemo(input: OcrDemoInput) {
      return runAction(() => appApi.ocrDemo.createJob(input));
    }
  };
}

function resolveActionError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "payload" in error &&
    typeof (error as { payload?: unknown }).payload === "object" &&
    (error as { payload?: { error?: { message?: string } } }).payload?.error?.message
  ) {
    return (error as { payload: { error: { message: string } } }).payload.error.message;
  }

  return error instanceof Error ? error.message : "unknown_error";
}
