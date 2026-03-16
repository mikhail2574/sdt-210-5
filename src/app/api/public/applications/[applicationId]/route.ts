import { NextResponse } from "next/server";

import { getDemoCustomerApplication } from "@/lib/demo/demo-store";

type ApplicationRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: ApplicationRouteProps) {
  const { applicationId } = await params;
  const application = getDemoCustomerApplication(applicationId);

  if (!application) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json(application);
}
