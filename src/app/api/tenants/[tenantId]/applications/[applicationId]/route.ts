import { NextResponse } from "next/server";

import { getDemoApplicationDetail } from "@/lib/demo/demo-store";

type ApplicationDetailRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: ApplicationDetailRouteProps) {
  const { applicationId } = await params;
  const detail = getDemoApplicationDetail(applicationId);

  if (!detail) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
