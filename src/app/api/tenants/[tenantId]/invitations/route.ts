import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type InvitationsRouteProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function GET(_: Request, { params }: InvitationsRouteProps) {
  const { tenantId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/invitations`);
}

export async function POST(request: Request, { params }: InvitationsRouteProps) {
  const { tenantId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/invitations`, {
    method: "POST",
    body: await request.text()
  });
}
