import { NextResponse } from "next/server";

import { buildApplicationDownload } from "@/lib/demo/downloads";

type StaffPdfRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(_: Request, { params }: StaffPdfRouteProps) {
  const { applicationId } = await params;
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
