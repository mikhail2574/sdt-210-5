import { NextResponse } from "next/server";

import { buildApplicationsCsv } from "@/lib/demo/downloads";

export async function GET() {
  return new NextResponse(buildApplicationsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="applications.csv"'
    }
  });
}
