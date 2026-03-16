import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createDemoDraft,
  createDemoInvitation,
  createDemoOcrJob,
  getDemoOcrJobs,
  getDraft,
  listDemoInvitations,
  resetDemoData
} from "@/services/demo-app-service";

describe("demo app service persistence", () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "week-06-demo-service-"));
    tempFile = path.join(tempDir, "backend.json");
    process.env.DEMO_DATA_FILE_PATH = tempFile;
    resetDemoData();
  });

  afterEach(() => {
    delete process.env.DEMO_DATA_FILE_PATH;
    rmSync(tempDir, { force: true, recursive: true });
  });

  it("persists invitations, drafts and OCR jobs to the configured backend file", () => {
    const invitation = createDemoInvitation("week6@example.com", "Admin");
    const draft = createDemoDraft("hausanschluss-demo", "antragsdetails", {
      selectedMedia: ["strom"],
      requestType: "new_connection"
    });
    const ocrJob = createDemoOcrJob("meter-photo.jpg", "Meter value 48123 kWh");

    expect(listDemoInvitations().some((item) => item.id === invitation.id)).toBe(true);
    expect(getDraft(draft.applicationId)?.applicationId).toBe(draft.applicationId);
    expect(getDemoOcrJobs().some((item) => item.id === ocrJob.id)).toBe(true);

    const persisted = JSON.parse(readFileSync(tempFile, "utf8")) as {
      invitations: Array<{ id: string }>;
      applications: Array<{ applicationId: string }>;
      ocrJobs: Array<{ id: string }>;
    };

    expect(persisted.invitations.some((item) => item.id === invitation.id)).toBe(true);
    expect(persisted.applications.some((item) => item.applicationId === draft.applicationId)).toBe(true);
    expect(persisted.ocrJobs.some((item) => item.id === ocrJob.id)).toBe(true);
  });
});
