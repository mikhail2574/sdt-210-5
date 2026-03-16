import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getAggregatedMissingSummary, getNextWizardPageKey } from "@/lib/demo/public-flow";
import { baseTheme, defaultOverridesByFormId } from "@/lib/forms/runtime-data";
import type { FormOverrideOperation, ThemeConfig } from "@/lib/forms/types";
import { getPersistentDemoDataFilePath } from "@/services/custom-backend-config";

type DemoPageData = Record<string, unknown>;

type DemoTimelineEntry = {
  status: string;
  at: string;
  note?: string;
};

export type DemoAuditEntry = {
  id: string;
  createdAt: string;
  actorName: string;
  pageKey: string;
  fieldPath: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
};

export type DemoInvitation = {
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

export type DemoOcrJob = {
  id: string;
  fileName: string;
  sourceText: string;
  extractedText: string;
  suggestedValue: string | null;
  createdAt: string;
};

type DemoDatabase = {
  version: 1;
  tenantTheme: ThemeConfig;
  tenantOverrides: Record<string, FormOverrideOperation[]>;
  invitations: DemoInvitation[];
  applications: DemoApplication[];
  ocrJobs: DemoOcrJob[];
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

export function createDemoDraft(formId: string, pageKey: string, data: DemoPageData) {
  return updateDatabase((database) => {
    const applicationId = randomUUID();
    const now = new Date().toISOString();
    const application: DemoApplication = withDerivedSummary({
      applicationId,
      tenantId: demoTenantId,
      formId,
      formKey: resolveFormKey(formId),
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
    });

    database.applications.push(application);
    return application;
  });
}

export function updateDemoDraft(applicationId: string, pageKey: string, data: DemoPageData) {
  return updateDatabase((database) => {
    const application = database.applications.find((item) => item.applicationId === applicationId);

    if (!application) {
      return null;
    }

    const next = withDerivedSummary({
      ...application,
      currentPageKey: pageKey,
      updatedAt: new Date().toISOString(),
      pageData: {
        ...application.pageData,
        [pageKey]: data
      }
    });

    replaceApplication(database, next);
    return next;
  });
}

export function getDraft(applicationId: string) {
  return readDatabase().applications.find((item) => item.applicationId === applicationId) ?? null;
}

export function getDemoApplicationSummary(applicationId: string) {
  const application = getDraft(applicationId);

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
  return updateDatabase((database) => {
    const current = database.applications.find((item) => item.applicationId === applicationId);

    if (!current) {
      return null;
    }

    const missingSummary = getAggregatedMissingSummary(current.formId, current.pageData);
    const status = missingSummary.soft.length > 0 || missingSummary.attachments.length > 0 ? "SUBMITTED_INCOMPLETE" : "SUBMITTED_COMPLETE";
    const trackingCode = current.trackingCode ?? buildTrackingCode(database.applications);
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

    replaceApplication(database, next);

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
  });
}

export function loginDemoCustomer(trackingCode: string, password: string) {
  const application = readDatabase().applications.find(
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
  const application = getDraft(applicationId);

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
  return [...readDatabase().applications]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((application) => ({
      applicationId: application.applicationId,
      trackingCode: application.trackingCode ?? "Draft",
      formKey: application.formKey,
      status: application.status,
      unreadByStaff: application.unreadByStaff,
      createdAt: application.createdAt,
      customerSummary: application.customerSummary,
      tenantId: application.tenantId
    }));
}

export function getDemoApplicationDetail(applicationId: string) {
  const application = getDraft(applicationId);

  if (!application) {
    return null;
  }

  return {
    ...application,
    missingSummary: getAggregatedMissingSummary(application.formId, application.pageData)
  };
}

export function markDemoApplicationRead(applicationId: string) {
  return updateDatabase((database) => {
    const application = database.applications.find((item) => item.applicationId === applicationId);

    if (!application) {
      return null;
    }

    const next = {
      ...application,
      unreadByStaff: false,
      updatedAt: new Date().toISOString()
    };

    replaceApplication(database, next);
    return next;
  });
}

export function saveDemoStaffEdits(
  applicationId: string,
  pageKey: string,
  edits: Array<{ fieldPath: string; newValue: unknown; reason: string }>
) {
  return updateDatabase((database) => {
    const application = database.applications.find((item) => item.applicationId === applicationId);

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

    replaceApplication(database, next);
    return next;
  });
}

export function transitionDemoApplication(applicationId: string, toStatus: string, note: string) {
  return updateDatabase((database) => {
    const application = database.applications.find((item) => item.applicationId === applicationId);

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

    replaceApplication(database, next);
    return next;
  });
}

export function scheduleDemoAppointment(applicationId: string, scheduledAt: string, notes: string) {
  return updateDatabase((database) => {
    const application = database.applications.find((item) => item.applicationId === applicationId);

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

    replaceApplication(database, next);
    return next;
  });
}

export function listDemoAuditEntries(applicationId: string) {
  return getDraft(applicationId)?.auditLog ?? [];
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
  return [...readDatabase().invitations].sort((left, right) => right.sentAt.localeCompare(left.sentAt));
}

export function createDemoInvitation(email: string, role: string) {
  return updateDatabase((database) => {
    const invitation: DemoInvitation = {
      id: randomUUID(),
      email,
      role,
      status: "pending",
      sentAt: new Date().toISOString()
    };

    database.invitations.push(invitation);
    return invitation;
  });
}

export function getDemoTenantTheme() {
  return readDatabase().tenantTheme;
}

export function updateDemoTenantTheme(nextTheme: ThemeConfig) {
  return updateDatabase((database) => {
    database.tenantTheme = nextTheme;
    return database.tenantTheme;
  });
}

export function listDemoForms() {
  return Object.keys(readDatabase().tenantOverrides).map((formId) => ({
    formId,
    titleI18nKey: "forms.hausanschluss.title"
  }));
}

export function getDemoFormOverride(formId: string) {
  return readDatabase().tenantOverrides[formId] ?? [];
}

export function updateDemoFormOverride(formId: string, operations: FormOverrideOperation[]) {
  return updateDatabase((database) => {
    database.tenantOverrides[formId] = operations;
    return database.tenantOverrides[formId] ?? [];
  });
}

export function getDemoTenantId() {
  return demoTenantId;
}

export function getDemoTenantCode() {
  return demoTenantCode;
}

export function getDemoOcrJobs() {
  return [...readDatabase().ocrJobs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function createDemoOcrJob(fileName: string, sourceText: string) {
  return updateDatabase((database) => {
    const extractedText = sourceText.trim() || `Simulated OCR for ${fileName}`;
    const suggestedValue = extractedText.match(/\d[\d.,]*/)?.[0] ?? null;
    const job: DemoOcrJob = {
      id: randomUUID(),
      fileName,
      sourceText,
      extractedText,
      suggestedValue,
      createdAt: new Date().toISOString()
    };

    database.ocrJobs.unshift(job);
    return job;
  });
}

export function resetDemoData() {
  writeDatabase(createSeedDatabase());
}

export function getNextDemoPageKey(pageKey: string) {
  return getNextWizardPageKey(pageKey);
}

function readDatabase() {
  const filePath = getPersistentDemoDataFilePath();

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as DemoDatabase;
    return normalizeDatabase(parsed);
  } catch {
    const next = createSeedDatabase();
    writeDatabase(next);
    return next;
  }
}

function updateDatabase<TResult>(updater: (database: DemoDatabase) => TResult) {
  const database = readDatabase();
  const result = updater(database);
  writeDatabase(database);
  return result;
}

function writeDatabase(database: DemoDatabase) {
  const filePath = getPersistentDemoDataFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(database, null, 2));
}

function normalizeDatabase(database: DemoDatabase) {
  const seed = createSeedDatabase();
  const next: DemoDatabase = {
    version: 1,
    tenantTheme: database.tenantTheme ?? seed.tenantTheme,
    tenantOverrides: {
      ...seed.tenantOverrides,
      ...(database.tenantOverrides ?? {})
    },
    invitations: database.invitations?.length ? database.invitations : seed.invitations,
    applications: database.applications?.length ? database.applications.map(withDerivedSummary) : seed.applications,
    ocrJobs: database.ocrJobs ?? seed.ocrJobs
  };

  if (!next.applications.some((item) => item.applicationId === "demo-application-1")) {
    next.applications.push(seed.applications.find((item) => item.applicationId === "demo-application-1")!);
  }

  if (!next.applications.some((item) => item.applicationId === "demo-application-2")) {
    next.applications.push(seed.applications.find((item) => item.applicationId === "demo-application-2")!);
  }

  if (!next.invitations.some((item) => item.id === "invite-demo-1")) {
    next.invitations.push(seed.invitations[0]);
  }

  return next;
}

function createSeedDatabase(): DemoDatabase {
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

  return {
    version: 1,
    tenantTheme: structuredClone(baseTheme),
    tenantOverrides: {
      "hausanschluss-demo": structuredClone(defaultOverridesByFormId["hausanschluss-demo"] ?? []),
      "hausanschluss-soft-demo": structuredClone(defaultOverridesByFormId["hausanschluss-soft-demo"] ?? [])
    },
    invitations: [
      {
        id: "invite-demo-1",
        email: "installateur@stadtwerke.demo",
        role: "Installateur",
        status: "pending",
        sentAt: "2026-03-08T08:00:00.000Z"
      }
    ],
    applications: [withDerivedSummary(baseApplication), withDerivedSummary(secondApplication)],
    ocrJobs: []
  };
}

function replaceApplication(database: DemoDatabase, application: DemoApplication) {
  const index = database.applications.findIndex((item) => item.applicationId === application.applicationId);

  if (index >= 0) {
    database.applications[index] = application;
    return;
  }

  database.applications.push(application);
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

function buildTrackingCode(applications: DemoApplication[]) {
  const maxSequence = applications.reduce((currentMax, application) => {
    const suffix = application.trackingCode?.match(/HA(\d+)$/)?.[1];
    const sequence = suffix ? Number.parseInt(suffix, 10) : 0;
    return Math.max(currentMax, sequence);
  }, 1015);

  return `317-000-HA${String(maxSequence + 1).padStart(5, "0")}`;
}

function resolveFormKey(formId: string) {
  if (formId.includes("hausanschluss")) {
    return demoFormKey;
  }

  return formId.replace(/-demo$/, "");
}
