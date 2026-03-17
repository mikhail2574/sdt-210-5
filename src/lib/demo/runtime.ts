import { cache } from "react";

import { getBackendFormRuntime } from "@/lib/backend/server-data";

export const getResolvedFormRuntime = cache(async function getResolvedFormRuntime(formId: string) {
  return getBackendFormRuntime(formId);
});
