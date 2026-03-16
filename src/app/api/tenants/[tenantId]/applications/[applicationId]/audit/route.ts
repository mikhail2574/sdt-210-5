import { NextResponse } from "next/server";

import { listDemoAuditEntries } from "@/lib/demo/demo-store";

type AuditRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: AuditRouteProps) {
  const { applicationId } = await params;
  return NextResponse.json({
    items: listDemoAuditEntries(applicationId)
  });
}
