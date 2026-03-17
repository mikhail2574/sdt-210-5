import { NextResponse } from "next/server";

import { proxyPublicBackendJson } from "@/lib/backend/api-gateway";

type ApplicationRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: ApplicationRouteProps) {
  const { applicationId } = await params;
  return proxyPublicBackendJson(`/applications/${applicationId}`);
}
