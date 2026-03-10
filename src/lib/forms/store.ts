import { randomUUID } from "node:crypto";

import type { AntragsdetailsFormValues } from "@/lib/forms/types";

type DraftRecord = {
  applicationId: string;
  formId: string;
  pageKey: string;
  data: AntragsdetailsFormValues;
  revision: number;
};

const drafts = new Map<string, DraftRecord>();

export function createDraft(formId: string, pageKey: string, data: AntragsdetailsFormValues) {
  const applicationId = randomUUID();

  drafts.set(applicationId, {
    applicationId,
    formId,
    pageKey,
    data,
    revision: 1
  });

  return drafts.get(applicationId)!;
}

export function updateDraft(applicationId: string, pageKey: string, data: AntragsdetailsFormValues) {
  const current = drafts.get(applicationId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    pageKey,
    data,
    revision: current.revision + 1
  };

  drafts.set(applicationId, next);
  return next;
}

export function getDraft(applicationId: string) {
  return drafts.get(applicationId) ?? null;
}
