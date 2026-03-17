import { NextResponse } from "next/server";

import { proxyBackofficeBinary } from "@/lib/backend/api-gateway";
import { getServerStaffUser } from "@/lib/demo/server-auth";

type ExportCsvRouteProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function GET(_: Request, { params }: ExportCsvRouteProps) {
  const { tenantId } = await params;
  const user = await getServerStaffUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return proxyBackofficeBinary(`/tenants/${tenantId}/exports/applications.csv`);
}
