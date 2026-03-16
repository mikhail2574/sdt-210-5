import { NextResponse } from "next/server";

import { markDemoApplicationRead } from "@/lib/demo/demo-store";

type MarkReadRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function POST(_: Request, { params }: MarkReadRouteProps) {
  const { applicationId } = await params;
  const updated = markDemoApplicationRead(applicationId);

  if (!updated) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, applicationId });
}
