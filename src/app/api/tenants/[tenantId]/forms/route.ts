import { NextResponse } from "next/server";

import { listDemoForms } from "@/lib/demo/demo-store";

export async function GET() {
  return NextResponse.json({
    items: listDemoForms()
  });
}
