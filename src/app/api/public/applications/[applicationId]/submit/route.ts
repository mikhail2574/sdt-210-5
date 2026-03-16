import { NextResponse } from "next/server";

import { submitDemoApplication } from "@/lib/demo/demo-store";

type SubmitRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function POST(request: Request, { params }: SubmitRouteProps) {
  const { applicationId } = await params;
  const body = (await request.json()) as {
    consents: Record<string, unknown>;
  };
  const result = submitDemoApplication(applicationId, body.consents);

  if (!result) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
