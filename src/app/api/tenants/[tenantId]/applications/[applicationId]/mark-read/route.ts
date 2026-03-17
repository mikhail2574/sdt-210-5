import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type MarkReadRouteProps = {
  params: Promise<{
    tenantId: string;
    applicationId: string;
  }>;
};

export async function POST(_: Request, { params }: MarkReadRouteProps) {
  const { tenantId, applicationId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/applications/${applicationId}/mark-read`, {
    method: "POST"
  });
}
