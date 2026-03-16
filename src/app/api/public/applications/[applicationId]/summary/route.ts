import { NextResponse } from "next/server";

import { getDemoApplicationSummary } from "@/lib/demo/demo-store";

type SummaryRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: SummaryRouteProps) {
  const { applicationId } = await params;
  const summary = getDemoApplicationSummary(applicationId);

  if (!summary) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json(summary);
}
