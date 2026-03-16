import { NextResponse } from "next/server";

import { transitionDemoApplication } from "@/lib/demo/demo-store";

type TransitionRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function POST(request: Request, { params }: TransitionRouteProps) {
  const { applicationId } = await params;
  const body = (await request.json()) as {
    toStatus: string;
    note: string;
  };
  const updated = transitionDemoApplication(applicationId, body.toStatus, body.note);

  if (!updated) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
