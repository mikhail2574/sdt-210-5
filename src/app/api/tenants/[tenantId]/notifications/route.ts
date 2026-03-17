import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type NotificationsRouteProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function GET(_: Request, { params }: NotificationsRouteProps) {
  const { tenantId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/notifications`);
}
