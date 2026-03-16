import { NextResponse } from "next/server";

import { listDemoApplications } from "@/lib/demo/demo-store";

export async function GET() {
  const items = listDemoApplications();
  return NextResponse.json({
    items,
    page: 1,
    pageSize: items.length,
    total: items.length
  });
}
