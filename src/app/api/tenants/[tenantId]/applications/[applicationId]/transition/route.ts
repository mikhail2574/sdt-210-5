import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type TransitionRouteProps = {
  params: Promise<{
    tenantId: string;
    applicationId: string;
  }>;
};

export async function POST(request: Request, { params }: TransitionRouteProps) {
  const { tenantId, applicationId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/applications/${applicationId}/transition`, {
    method: "POST",
    body: await request.text()
  });
}
