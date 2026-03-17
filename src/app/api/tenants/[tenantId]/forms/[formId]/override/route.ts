import { NextResponse } from "next/server";

import { proxyBackofficeJson } from "@/lib/backend/api-gateway";

type FormOverrideRouteProps = {
  params: Promise<{
    tenantId: string;
    formId: string;
  }>;
};

export async function GET(_: Request, { params }: FormOverrideRouteProps) {
  const { tenantId, formId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/forms/${formId}/override`);
}

export async function PUT(request: Request, { params }: FormOverrideRouteProps) {
  const { tenantId, formId } = await params;
  return proxyBackofficeJson(`/tenants/${tenantId}/forms/${formId}/override`, {
    method: "PUT",
    body: await request.text()
  });
}
