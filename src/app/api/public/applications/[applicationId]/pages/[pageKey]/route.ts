import { NextResponse } from "next/server";

import { proxyPublicBackendJson } from "@/lib/backend/api-gateway";

type UpdatePageRouteProps = {
  params: Promise<{
    applicationId: string;
    pageKey: string;
  }>;
};

export async function PUT(request: Request, { params }: UpdatePageRouteProps) {
  const { applicationId, pageKey } = await params;
  return proxyPublicBackendJson(`/applications/${applicationId}/pages/${pageKey}`, {
    method: "PUT",
    body: await request.text()
  });
}
