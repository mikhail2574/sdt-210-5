import { createDemoDraft, getDraft as getDemoDraft, updateDemoDraft } from "@/lib/demo/demo-store";

export function createDraft(formId: string, pageKey: string, data: Record<string, unknown>) {
  return createDemoDraft(formId, pageKey, data);
}

export function updateDraft(applicationId: string, pageKey: string, data: Record<string, unknown>) {
  return updateDemoDraft(applicationId, pageKey, data);
}

export function getDraft(applicationId: string) {
  return getDemoDraft(applicationId);
}
