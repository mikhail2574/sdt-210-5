import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type StaffEditRouteProps = {
  params: Promise<{
    tenantId: string;
    applicationId: string;
    pageKey: string;
  }>;
};

export async function PATCH(request: Request, { params }: StaffEditRouteProps) {
  const { tenantId, applicationId, pageKey } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/applications/${applicationId}/pages/${pageKey}`, {
    method: "PATCH",
    body: await request.text()
  });
}
