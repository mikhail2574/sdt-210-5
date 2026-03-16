import { randomUUID } from "node:crypto";

import { getAggregatedMissingSummary, getNextWizardPageKey } from "@/lib/demo/public-flow";
import { baseTheme, defaultOverridesByFormId } from "@/lib/forms/runtime-data";
import type { FormOverrideOperation, ThemeConfig } from "@/lib/forms/types";

type DemoPageData = Record<string, unknown>;

type DemoTimelineEntry = {
  status: string;
  at: string;
  note?: string;
};

type DemoAuditEntry = {
  id: string;
  createdAt: string;
  actorName: string;
  pageKey: string;
  fieldPath: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
};

type DemoInvitation = {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted";
  sentAt: string;
};

type DemoStaffSession = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    tenantId: string;
  };
};

export type DemoApplication = {
  applicationId: string;
  tenantId: string;
  formId: string;
  formKey: string;
  status: string;
  currentPageKey: string;
  trackingCode: string | null;
  password: string | null;
  unreadByStaff: boolean;
  createdAt: string;
  updatedAt: string;
  pageData: Record<string, DemoPageData>;
  auditLog: DemoAuditEntry[];
  timeline: DemoTimelineEntry[];
  staffModifiedFields: string[];
  customerSummary: {
    name: string;
    address: string;
  };
  appointment: {
    scheduledAt: string;
    notes: string;
  } | null;
  consents: Record<string, unknown> | null;
};

const demoTenantId = "tenant-demo";
const demoTenantCode = "P001";
const demoFormKey = "hausanschluss";

const staffSession: DemoStaffSession = {
  accessToken: "demo-staff-token",
  user: {
    id: "staff-demo-1",
    email: "staff@stadtwerke.demo",
    displayName: "Marta Becker",
    role: "Stadtwerke Admin",
    tenantId: demoTenantId
  }
};

const invitations = new Map<string, DemoInvitation>([
  [
    "invite-demo-1",
    {
      id: "invite-demo-1",
      email: "installateur@stadtwerke.demo",
      role: "Installateur",
      status: "pending",
      sentAt: "2026-03-08T08:00:00.000Z"
    }
  ]
]);

let tenantTheme: ThemeConfig = structuredClone(baseTheme);

const tenantOverrides = new Map<string, FormOverrideOperation[]>([
  [
    "hausanschluss-demo",
    structuredClone(defaultOverridesByFormId["hausanschluss-demo"] ?? [])
  ],
  [
    "hausanschluss-soft-demo",
    structuredClone(defaultOverridesByFormId["hausanschluss-soft-demo"] ?? [])
  ]
]);

const applications = new Map<string, DemoApplication>();

seedDemoApplications();

export function createDemoDraft(formId: string, pageKey: string, data: DemoPageData) {
  const applicationId = randomUUID();
  const now = new Date().toISOString();
  const application: DemoApplication = {
    applicationId,
    tenantId: demoTenantId,
    formId,
    formKey: demoFormKey,
    status: "DRAFT",
    currentPageKey: pageKey,
    trackingCode: null,
    password: null,
    unreadByStaff: true,
    createdAt: now,
    updatedAt: now,
    pageData: {
      [pageKey]: data
    },
    auditLog: [],
    timeline: [
      {
        status: "DRAFT",
        at: now,
        note: "Draft created"
      }
    ],
    staffModifiedFields: [],
    customerSummary: {
      name: "New draft",
      address: "No address yet"
    },
    appointment: null,
    consents: null
  };

  applications.set(applicationId, withDerivedSummary(application));
  return applications.get(applicationId)!;
}

export function updateDemoDraft(applicationId: string, pageKey: string, data: DemoPageData) {
  const current = applications.get(applicationId);

  if (!current) {
    return null;
  }

  const next = withDerivedSummary({
    ...current,
    currentPageKey: pageKey,
    updatedAt: new Date().toISOString(),
    pageData: {
      ...current.pageData,
      [pageKey]: data
    }
  });

  applications.set(applicationId, next);
  return next;
}

export function getDraft(applicationId: string) {
  return applications.get(applicationId) ?? null;
}

export function getDemoApplicationSummary(applicationId: string) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  const missingSummary = getAggregatedMissingSummary(application.formId, application.pageData);

  return {
    applicationId: application.applicationId,
    status: application.status,
    pages: Object.entries(application.pageData).map(([pageKey, data]) => ({
      pageKey,
      data,
      missing: {
        hard: missingSummary.hard.filter((item) => item.pageKey === pageKey),
        soft: missingSummary.soft.filter((item) => item.pageKey === pageKey),
        attachments: missingSummary.attachments.filter((item) => item.pageKey === pageKey)
      }
    })),
    missingSummary
  };
}

export function submitDemoApplication(applicationId: string, consents: Record<string, unknown>) {
  const current = applications.get(applicationId);

  if (!current) {
    return null;
  }

  const missingSummary = getAggregatedMissingSummary(current.formId, current.pageData);
  const status = missingSummary.soft.length > 0 || missingSummary.attachments.length > 0 ? "SUBMITTED_INCOMPLETE" : "SUBMITTED_COMPLETE";
  const trackingCode = current.trackingCode ?? buildTrackingCode();
  const password = current.password ?? "DemoPass!2026";
  const updatedAt = new Date().toISOString();

  const next = withDerivedSummary({
    ...current,
    status,
    trackingCode,
    password,
    consents,
    currentPageKey: "final",
    updatedAt,
    timeline: [
      ...current.timeline,
      {
        status,
        at: updatedAt,
        note: "Customer submitted the application"
      }
    ]
  });

  applications.set(applicationId, next);

  return {
    status,
    trackingCode,
    password,
    passwordIssued: true,
    pdf: {
      applicationPdfReady: true
    },
    missingSummary
  };
}

export function loginDemoCustomer(trackingCode: string, password: string) {
  const application = Array.from(applications.values()).find(
    (candidate) => candidate.trackingCode === trackingCode && candidate.password === password
  );

  if (!application) {
    return null;
  }

  return {
    applicationId: application.applicationId,
    status: application.status,
    expiresInSeconds: 1209600
  };
}

export function getDemoCustomerApplication(applicationId: string) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  return {
    applicationId: application.applicationId,
    formId: application.formId,
    currentPageKey: application.currentPageKey,
    status: application.status,
    trackingCode: application.trackingCode,
    customerSummary: application.customerSummary,
    timeline: application.timeline,
    missingSummary: getAggregatedMissingSummary(application.formId, application.pageData),
    availableActions: {
      resume: true,
      downloadPdf: application.trackingCode !== null
    }
  };
}

export function loginDemoStaff(email: string, password: string) {
  if (email !== staffSession.user.email || password !== "demo12345") {
    return null;
  }

  return staffSession;
}

export function getDemoProfile(accessToken: string) {
  if (accessToken !== staffSession.accessToken) {
    return null;
  }

  return staffSession.user;
}

export function listDemoApplications() {
  return Array.from(applications.values())
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((application) => ({
      applicationId: application.applicationId,
      trackingCode: application.trackingCode ?? "Draft",
      formKey: application.formKey,
      status: application.status,
      unreadByStaff: application.unreadByStaff,
      createdAt: application.createdAt,
      customerSummary: application.customerSummary
    }));
}

export function getDemoApplicationDetail(applicationId: string) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  return {
    ...application,
    missingSummary: getAggregatedMissingSummary(application.formId, application.pageData)
  };
}

export function markDemoApplicationRead(applicationId: string) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  const next = {
    ...application,
    unreadByStaff: false
  };

  applications.set(applicationId, next);
  return next;
}

export function saveDemoStaffEdits(
  applicationId: string,
  pageKey: string,
  edits: Array<{ fieldPath: string; newValue: unknown; reason: string }>
) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  const pageData = {
    ...(application.pageData[pageKey] ?? {})
  };

  const auditEntries = edits.map((edit) => {
    const fieldKey = edit.fieldPath.split(".").at(-1) ?? edit.fieldPath;
    const oldValue = pageData[fieldKey];
    pageData[fieldKey] = edit.newValue;

    return {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      actorName: staffSession.user.displayName,
      pageKey,
      fieldPath: edit.fieldPath,
      oldValue,
      newValue: edit.newValue,
      reason: edit.reason
    } satisfies DemoAuditEntry;
  });

  const next = withDerivedSummary({
    ...application,
    updatedAt: new Date().toISOString(),
    pageData: {
      ...application.pageData,
      [pageKey]: pageData
    },
    auditLog: [...auditEntries, ...application.auditLog],
    staffModifiedFields: [
      ...new Set([...application.staffModifiedFields, ...edits.map((edit) => edit.fieldPath)])
    ]
  });

  applications.set(applicationId, next);
  return next;
}

export function transitionDemoApplication(applicationId: string, toStatus: string, note: string) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  const next = {
    ...application,
    status: toStatus,
    updatedAt: new Date().toISOString(),
    timeline: [
      ...application.timeline,
      {
        status: toStatus,
        at: new Date().toISOString(),
        note
      }
    ]
  };

  applications.set(applicationId, next);
  return next;
}

export function scheduleDemoAppointment(applicationId: string, scheduledAt: string, notes: string) {
  const application = applications.get(applicationId);

  if (!application) {
    return null;
  }

  const next = {
    ...application,
    appointment: {
      scheduledAt,
      notes
    },
    updatedAt: new Date().toISOString(),
    status: "SCHEDULED",
    timeline: [
      ...application.timeline,
      {
        status: "SCHEDULED",
        at: new Date().toISOString(),
        note: notes || scheduledAt
      }
    ]
  };

  applications.set(applicationId, next);
  return next;
}

export function listDemoAuditEntries(applicationId: string) {
  return applications.get(applicationId)?.auditLog ?? [];
}

export function listDemoNotifications() {
  return listDemoApplications()
    .filter((application) => application.unreadByStaff)
    .map((application) => ({
      id: application.applicationId,
      kind: "new_application",
      createdAt: application.createdAt,
      label: `${application.customerSummary.name} submitted ${application.formKey}`,
      applicationId: application.applicationId
    }));
}

export function listDemoInvitations() {
  return Array.from(invitations.values()).sort((left, right) => right.sentAt.localeCompare(left.sentAt));
}

export function createDemoInvitation(email: string, role: string) {
  const invitation: DemoInvitation = {
    id: randomUUID(),
    email,
    role,
    status: "pending",
    sentAt: new Date().toISOString()
  };

  invitations.set(invitation.id, invitation);
  return invitation;
}

export function getDemoTenantTheme() {
  return tenantTheme;
}

export function updateDemoTenantTheme(nextTheme: ThemeConfig) {
  tenantTheme = nextTheme;
  return tenantTheme;
}

export function listDemoForms() {
  return [
    {
      formId: "hausanschluss-demo",
      titleI18nKey: "forms.hausanschluss.title"
    },
    {
      formId: "hausanschluss-soft-demo",
      titleI18nKey: "forms.hausanschluss.title"
    }
  ];
}

export function getDemoFormOverride(formId: string) {
  return tenantOverrides.get(formId) ?? [];
}

export function updateDemoFormOverride(formId: string, operations: FormOverrideOperation[]) {
  tenantOverrides.set(formId, operations);
  return tenantOverrides.get(formId) ?? [];
}

export function getDemoTenantId() {
  return demoTenantId;
}

export function getDemoTenantCode() {
  return demoTenantCode;
}

function withDerivedSummary(application: DemoApplication) {
  const contactPage = application.pageData["kontaktdaten"] ?? {};
  const addressPage = application.pageData["anschlussort"] ?? {};
  const name = [contactPage.firstName, contactPage.lastName].filter((value) => typeof value === "string" && value.length > 0).join(" ");
  const address = [addressPage.street, addressPage.houseNumber, addressPage.postalCode, addressPage.city]
    .filter((value) => typeof value === "string" && value.length > 0)
    .join(", ");

  return {
    ...application,
    customerSummary: {
      name: name || application.customerSummary.name,
      address: address || application.customerSummary.address
    }
  };
}

function buildTrackingCode() {
  const sequence = String(applications.size + 16).padStart(5, "0");
  return `317-000-HA${sequence}`;
}

function seedDemoApplications() {
  if (applications.size > 0) {
    return;
  }

  const baseApplication: DemoApplication = {
    applicationId: "demo-application-1",
    tenantId: demoTenantId,
    formId: "hausanschluss-demo",
    formKey: demoFormKey,
    status: "SUBMITTED_INCOMPLETE",
    currentPageKey: "final",
    trackingCode: "317-000-HA01016",
    password: "DemoPass!2026",
    unreadByStaff: true,
    createdAt: "2026-03-09T09:15:00.000Z",
    updatedAt: "2026-03-10T07:45:00.000Z",
    pageData: {
      antragsdetails: {
        selectedMedia: ["strom", "wasser"],
        requestType: "change_connection",
        changeKind: "anlagen_erweiterung",
        wunschtermin: "2026-03-20",
        message: ""
      },
      anschlussort: {
        addressUnknown: false,
        postalCode: "10115",
        city: "Berlin",
        street: "Invalidenstrasse",
        houseNumber: "117",
        objectType: "gebaeude",
        usageType: "mehrfamilienhaus",
        lageplanUploads: []
      },
      kontaktdaten: {
        salutation: "frau",
        firstName: "Anna",
        lastName: "Schneider",
        email: "anna.schneider@example.de",
        confirmEmail: "anna.schneider@example.de",
        phone: "",
        applicantIsTechnicalContact: false,
        technicalContactName: ""
      },
      "technische-daten": {
        electricianMode: "registered",
        connectionPowerKw: "36",
        hasWallbox: true,
        wallboxCount: "2",
        hasPv: true,
        notes: ""
      },
      "rechtliche-hinweise": {
        privacyPolicyAccepted: true,
        dataProcessingAccepted: true,
        emailCommunicationAccepted: true,
        consentVersion: "2026-03-10",
        language: "de"
      }
    },
    auditLog: [
      {
        id: "audit-demo-1",
        createdAt: "2026-03-10T07:50:00.000Z",
        actorName: "Marta Becker",
        pageKey: "kontaktdaten",
        fieldPath: "kontaktdaten.email",
        oldValue: "ana.schneider@example.de",
        newValue: "anna.schneider@example.de",
        reason: "Typo fix from phone confirmation"
      }
    ],
    timeline: [
      {
        status: "DRAFT",
        at: "2026-03-09T09:15:00.000Z",
        note: "Draft created"
      },
      {
        status: "SUBMITTED_INCOMPLETE",
        at: "2026-03-09T09:46:00.000Z",
        note: "Submitted with missing soft-required fields"
      }
    ],
    staffModifiedFields: ["kontaktdaten.email"],
    customerSummary: {
      name: "Anna Schneider",
      address: "Invalidenstrasse 117, 10115, Berlin"
    },
    appointment: null,
    consents: {
      privacyPolicyAccepted: true,
      dataProcessingAccepted: true,
      emailCommunicationAccepted: true,
      consentVersion: "2026-03-10",
      language: "de"
    }
  };

  const secondApplication: DemoApplication = {
    ...baseApplication,
    applicationId: "demo-application-2",
    trackingCode: "317-000-HA01017",
    unreadByStaff: false,
    status: "UNDER_REVIEW",
    createdAt: "2026-03-07T11:20:00.000Z",
    updatedAt: "2026-03-10T06:15:00.000Z",
    customerSummary: {
      name: "Lukas Wagner",
      address: "Bergstrasse 8, 04109, Leipzig"
    },
    pageData: {
      ...baseApplication.pageData,
      antragsdetails: {
        selectedMedia: ["gas"],
        requestType: "new_connection",
        changeKind: "",
        wunschtermin: "2026-04-03",
        message: "Please coordinate with the property manager."
      },
      anschlussort: {
        addressUnknown: false,
        postalCode: "04109",
        city: "Leipzig",
        street: "Bergstrasse",
        houseNumber: "8",
        objectType: "gebaeude",
        usageType: "einfamilienhaus",
        lageplanUploads: [
          {
            name: "lageplan.pdf",
            size: 231245,
            type: "application/pdf"
          }
        ]
      },
      kontaktdaten: {
        salutation: "herr",
        firstName: "Lukas",
        lastName: "Wagner",
        email: "lukas.wagner@example.de",
        confirmEmail: "lukas.wagner@example.de",
        phone: "+49 151 1000000",
        applicantIsTechnicalContact: true,
        technicalContactName: ""
      }
    },
    timeline: [
      {
        status: "DRAFT",
        at: "2026-03-07T11:20:00.000Z",
        note: "Draft created"
      },
      {
        status: "SUBMITTED_COMPLETE",
        at: "2026-03-07T11:43:00.000Z",
        note: "Submitted with no soft missing fields"
      },
      {
        status: "UNDER_REVIEW",
        at: "2026-03-10T06:15:00.000Z",
        note: "Staff review started"
      }
    ]
  };

  applications.set(baseApplication.applicationId, withDerivedSummary(baseApplication));
  applications.set(secondApplication.applicationId, withDerivedSummary(secondApplication));
}

export function getNextDemoPageKey(pageKey: string) {
  return getNextWizardPageKey(pageKey);
}
