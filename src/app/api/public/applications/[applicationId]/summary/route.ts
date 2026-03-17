import { NextResponse } from "next/server";

import { proxyPublicBackendJson } from "@/lib/backend/api-gateway";

type SummaryRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: SummaryRouteProps) {
  const { applicationId } = await params;
  return proxyPublicBackendJson(`/applications/${applicationId}/summary`);
}
