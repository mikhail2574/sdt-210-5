import { NextResponse } from "next/server";

import { buildApplicationsCsv } from "@/lib/demo/downloads";
import { getServerStaffUser } from "@/lib/demo/server-auth";

export async function GET() {
  const user = await getServerStaffUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return new NextResponse(buildApplicationsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="applications.csv"'
    }
  });
}
