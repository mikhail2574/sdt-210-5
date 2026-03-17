import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type FormsRouteProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function GET(_: Request, { params }: FormsRouteProps) {
  const { tenantId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/forms`);
}
