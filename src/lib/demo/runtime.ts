import { getBackendFormRuntime } from "@/lib/backend/server-data";

export async function getResolvedFormRuntime(formId: string) {
  return getBackendFormRuntime(formId);
}
