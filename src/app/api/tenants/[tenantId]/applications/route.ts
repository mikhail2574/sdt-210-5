import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type ApplicationsRouteProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function GET(request: Request, { params }: ApplicationsRouteProps) {
  const { tenantId } = await params;
  const search = new URL(request.url).search;
  return proxyBackofficeJson(`/tenants/${tenantId}/applications${search}`);
}
