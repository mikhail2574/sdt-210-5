import { NextResponse } from "next/server";

import { saveDemoStaffEdits } from "@/lib/demo/demo-store";

type StaffEditRouteProps = {
  params: Promise<{
    applicationId: string;
    pageKey: string;
  }>;
};

export async function PATCH(request: Request, { params }: StaffEditRouteProps) {
  const { applicationId, pageKey } = await params;
  const body = (await request.json()) as {
    edits: Array<{ fieldPath: string; newValue: unknown; reason: string }>;
  };
  const updated = saveDemoStaffEdits(applicationId, pageKey, body.edits);

  if (!updated) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    applicationId,
    pageKey
  });
}
