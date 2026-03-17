import { redirect } from "next/navigation";

import { BackendApiError, requestBackofficeJson, requestPublicBackendJson } from "@/lib/backend/api-gateway";
import { resolveBackendFormId } from "@/lib/forms/demo-catalog";
import type { FormOverrideOperation, FormRuntime, ThemeConfig } from "@/lib/forms/types";
import type { Locale } from "@/lib/i18n";

type MissingSummaryItem = {
  pageKey: string;
  fieldPath: string;
  labelKey: string;
  issue?: string;
  kind: "field" | "attachment";
};

type PublicApplicationSummary = {
  applicationId: string;
  status: string;
  pages: Array<{
    pageKey: string;
    data: Record<string, unknown>;
    missing: {
      hard: MissingSummaryItem[];
      soft: MissingSummaryItem[];
      attachments: MissingSummaryItem[];
    };
  }>;
  missingSummary: {
    hard: MissingSummaryItem[];
    soft: MissingSummaryItem[];
    attachments: MissingSummaryItem[];
  };
};

type PublicCustomerApplication = {
  applicationId: string;
  formId: string;
  status: string;
  currentPageKey: string;
  trackingCode: string | null;
  customerSummary: {
    name: string;
    address: string;
  };
  timeline: Array<{
    status: string;
    at: string;
    note?: string;
  }>;
  attachments: Array<{
    attachmentId: string;
    categoryKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    status: string;
    uploadedAt: string;
  }>;
  missingSummary: PublicApplicationSummary["missingSummary"];
  availableActions: {
    resume: boolean;
    downloadPdf: boolean;
  };
};

type StaffNotification = {
  id: string;
  applicationId: string;
  label: string;
  createdAt: string;
};

export type StaffUserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  tenantId: string;
  tenants: Array<{
    tenantId: string;
    role: string;
  }>;
};

export type BackofficeApplicationListItem = {
  applicationId: string;
  trackingCode: string | null;
  formKey: string;
  status: string;
  unreadByStaff: boolean;
  createdAt: string;
  customerSummary: {
    name: string;
    address: string;
  };
};

export type BackofficeApplicationDetail = {
  applicationId: string;
  tenantId: string;
  trackingCode: string | null;
  formKey: string;
  status: string;
  unreadByStaff: boolean;
  createdAt: string;
  updatedAt: string;
  customerSummary: {
    name: string;
    address: string;
  };
  timeline: Array<{
    status: string;
    at: string;
    note?: string;
  }>;
  appointment: {
    id: string;
    scheduledAt: string;
    timezone: string;
    scheduledByUserId: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  attachments: PublicCustomerApplication["attachments"];
  pageData: Record<string, Record<string, unknown>>;
  missingSummary: PublicApplicationSummary["missingSummary"];
  auditLog: Array<{
    id: string;
    createdAt: string;
    actorName: string;
    pageKey: string;
    fieldPath: string;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
  }>;
  staffModifiedFields: string[];
};

export type BackofficeInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  sentAt: string;
};

export type BackofficeFormRecord = {
  formId: string;
  titleI18nKey: string;
};

export async function getBackendFormRuntime(formId: string) {
  return requestPublicBackendJson<FormRuntime>(`/forms/${resolveBackendFormId(formId)}`);
}

export async function getPublicApplicationSummary(applicationId: string) {
  try {
    return await requestPublicBackendJson<PublicApplicationSummary>(`/applications/${applicationId}/summary`);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getPublicApplication(applicationId: string) {
  try {
    return await requestPublicBackendJson<PublicCustomerApplication>(`/applications/${applicationId}`);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getApplicationDraft(applicationId: string) {
  const summary = await getPublicApplicationSummary(applicationId);

  if (!summary) {
    return null;
  }

  return {
    applicationId: summary.applicationId,
    status: summary.status,
    pageData: Object.fromEntries(summary.pages.map((page) => [page.pageKey, page.data]))
  };
}

export async function getServerStaffUser() {
  try {
    return await requestBackofficeJson<StaffUserProfile>("/me");
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function requireServerStaffUser(locale: Locale) {
  const user = await getServerStaffUser();

  if (!user) {
    redirect(`/${locale}/backoffice/login`);
  }

  return user;
}

export async function getBackofficeApplications(tenantId: string, filters: Record<string, string | undefined> = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return requestBackofficeJson<{
    items: BackofficeApplicationListItem[];
    page: number;
    pageSize: number;
    total: number;
  }>(`/tenants/${tenantId}/applications${suffix}`);
}

export async function getBackofficeApplicationsForTenants(tenantIds: string[], filters: Record<string, string | undefined> = {}) {
  const payloads = await Promise.all(tenantIds.map((tenantId) => getBackofficeApplications(tenantId, filters)));
  const items = payloads
    .flatMap((payload) => payload.items)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    items,
    page: 1,
    pageSize: items.length,
    total: items.length
  };
}

export async function getBackofficeApplicationDetail(tenantId: string, applicationId: string) {
  try {
    return await requestBackofficeJson<BackofficeApplicationDetail>(`/tenants/${tenantId}/applications/${applicationId}`);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getBackofficeApplicationDetailForTenants(tenantIds: string[], applicationId: string) {
  for (const tenantId of tenantIds) {
    const detail = await getBackofficeApplicationDetail(tenantId, applicationId);

    if (detail) {
      return detail;
    }
  }

  return null;
}

export async function getBackofficeNotifications(tenantId: string) {
  const payload = await requestBackofficeJson<{
    unreadCount: number;
    items: StaffNotification[];
  }>(`/tenants/${tenantId}/notifications`);

  return payload;
}

export async function getBackofficeNotificationsForTenants(tenantIds: string[]) {
  const payloads = await Promise.all(tenantIds.map((tenantId) => getBackofficeNotifications(tenantId)));
  const items = payloads
    .flatMap((payload) => payload.items)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    unreadCount: items.length,
    items
  };
}

export async function getBackofficeInvitations(tenantId: string) {
  const payload = await requestBackofficeJson<{
    items: BackofficeInvitation[];
  }>(`/tenants/${tenantId}/invitations`);

  return payload.items;
}

export async function getBackofficeTheme(tenantId: string) {
  return requestBackofficeJson<ThemeConfig>(`/tenants/${tenantId}/theme`);
}

export async function getBackofficeForms(tenantId: string) {
  const payload = await requestBackofficeJson<{
    items: BackofficeFormRecord[];
  }>(`/tenants/${tenantId}/forms`);

  return payload.items;
}

export async function getBackofficeFormOverride(tenantId: string, formId: string) {
  return requestBackofficeJson<{
    formId: string;
    operations: FormOverrideOperation[];
  }>(`/tenants/${tenantId}/forms/${formId}/override`);
}
