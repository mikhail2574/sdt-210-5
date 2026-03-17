import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type ApplicationDetailRouteProps = {
  params: Promise<{
    tenantId: string;
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: ApplicationDetailRouteProps) {
  const { tenantId, applicationId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/applications/${applicationId}`);
}
