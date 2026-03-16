import { NextResponse } from "next/server";

import { buildApplicationDownload } from "@/lib/demo/downloads";
import { getServerStaffUser } from "@/lib/demo/server-auth";

type StaffPdfRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: StaffPdfRouteProps) {
  const { applicationId } = await params;
  const user = await getServerStaffUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const content = buildApplicationDownload(applicationId);

  if (!content) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${applicationId}.pdf"`
    }
  });
}
