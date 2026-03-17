import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type AppointmentRouteProps = {
  params: Promise<{
    tenantId: string;
    applicationId: string;
  }>;
};

export async function POST(request: Request, { params }: AppointmentRouteProps) {
  const { tenantId, applicationId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/applications/${applicationId}/appointment`, {
    method: "POST",
    body: await request.text()
  });
}
