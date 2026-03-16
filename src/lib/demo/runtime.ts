import { getBackendFormRuntime } from "@/lib/backend/public-api";
import { resolveLocalRuntimeFormId } from "@/lib/forms/demo-catalog";
import { getFormRuntime } from "@/lib/forms/runtime";

export async function getResolvedFormRuntime(formId: string) {
  try {
    return await getBackendFormRuntime(formId);
  } catch {
    return getFormRuntime(resolveLocalRuntimeFormId(formId));
  }
}
