import { NextResponse } from "next/server";

import { proxyPublicBackendJson } from "@/lib/backend/api-gateway";
import { resolveBackendFormId } from "@/lib/forms/demo-catalog";

type DraftRouteProps = {
  params: Promise<{
    formId: string;
  }>;
};

export async function POST(request: Request, { params }: DraftRouteProps) {
  const { formId } = await params;
  return proxyPublicBackendJson(`/forms/${resolveBackendFormId(formId)}/applications:draft`, {
    method: "POST",
    body: await request.text()
  });
}
