import { NextResponse } from "next/server";

import { proxyPublicBackendJson } from "@/lib/backend/api-gateway";

type SubmitRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function POST(request: Request, { params }: SubmitRouteProps) {
  const { applicationId } = await params;
  return proxyPublicBackendJson(`/applications/${applicationId}/submit`, {
    method: "POST",
    body: await request.text()
  });
}
