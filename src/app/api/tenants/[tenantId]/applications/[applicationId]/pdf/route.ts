import { NextResponse } from "next/server";

import { proxyBackofficeBinary } from "@/lib/backend/api-gateway";
import { getServerStaffUser } from "@/lib/demo/server-auth";

type StaffPdfRouteProps = {
  params: Promise<{
    tenantId: string;
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: StaffPdfRouteProps) {
  const { tenantId, applicationId } = await params;
  const user = await getServerStaffUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return proxyBackofficeBinary(`/tenants/${tenantId}/applications/${applicationId}/pdf`);
}
