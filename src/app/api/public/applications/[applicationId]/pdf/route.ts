import { NextResponse } from "next/server";

import { proxyPublicBackendBinary } from "@/lib/backend/api-gateway";
import { getServerCustomerApplicationId } from "@/lib/demo/server-auth";

type PdfRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: PdfRouteProps) {
  const { applicationId } = await params;
  const sessionApplicationId = await getServerCustomerApplicationId();

  if (sessionApplicationId !== applicationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return proxyPublicBackendBinary(`/applications/${applicationId}/pdf`);
}
