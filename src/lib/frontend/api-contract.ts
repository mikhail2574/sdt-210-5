import type { FormOverrideOperation, ThemeConfig } from "@/lib/forms/types";

export type StaffSession = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    tenantId: string;
  };
};

export type IssuedCredential = {
  applicationId: string;
  trackingCode: string;
  password: string;
};

export type CustomerLoginInput = {
  trackingCode: string;
  password: string;
};

export type CustomerLoginResponse = {
  applicationId: string;
};

export type StaffLoginInput = {
  email: string;
  password: string;
};

export type PublicValidationItem = {
  fieldPath: string;
  labelKey: string;
  messageKey?: string;
  kind?: string;
  pageKey?: string;
};

export type PublicValidation = {
  hardMissing?: PublicValidationItem[];
  softMissing?: PublicValidationItem[];
  attachments?: PublicValidationItem[];
};

export type ValidationErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: PublicValidationItem[];
  };
};

export type SavePublicApplicationPageInput = {
  applicationId?: string | null;
  formId: string;
  pageKey: string;
  data: Record<string, unknown>;
  clientRevision?: number;
};

export type SavePublicApplicationPageResponse = {
  applicationId: string;
  nextPageKey: string;
  status?: string;
  validation?: PublicValidation;
};

export type SubmitPublicApplicationInput = {
  consents: Record<string, unknown>;
};

export type InviteUserInput = {
  email: string;
  role: string;
};

export type TransitionApplicationInput = {
  toStatus: string;
  note: string;
};

export type ScheduleAppointmentInput = {
  scheduledAt: string;
  notes: string;
};

export type SaveStaffPageEditsInput = {
  edits: Array<{
    fieldPath: string;
    newValue: unknown;
    reason: string;
  }>;
};

export interface CustomerAuthApi {
  login(input: CustomerLoginInput): Promise<CustomerLoginResponse>;
}

export interface StaffAuthApi {
  login(input: StaffLoginInput): Promise<StaffSession>;
  logout(): Promise<void>;
}

export interface PublicApplicationsApi {
  savePage(input: SavePublicApplicationPageInput): Promise<SavePublicApplicationPageResponse>;
  submitApplication(applicationId: string, input: SubmitPublicApplicationInput): Promise<IssuedCredential>;
}

export interface BackofficeApi {
  inviteUser(tenantId: string, input: InviteUserInput): Promise<void>;
  updateTheme(tenantId: string, theme: ThemeConfig): Promise<void>;
  updateFormOverride(tenantId: string, formId: string, operations: FormOverrideOperation[]): Promise<void>;
  markApplicationRead(tenantId: string, applicationId: string): Promise<void>;
  transitionApplication(tenantId: string, applicationId: string, input: TransitionApplicationInput): Promise<void>;
  scheduleAppointment(tenantId: string, applicationId: string, input: ScheduleAppointmentInput): Promise<void>;
  saveApplicationEdits(tenantId: string, applicationId: string, pageKey: string, input: SaveStaffPageEditsInput): Promise<void>;
}

export interface FrontendApi {
  customerAuth: CustomerAuthApi;
  staffAuth: StaffAuthApi;
  publicApplications: PublicApplicationsApi;
  backoffice: BackofficeApi;
}
