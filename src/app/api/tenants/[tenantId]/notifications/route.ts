import { NextResponse } from "next/server";

import { listDemoNotifications } from "@/lib/demo/demo-store";

export async function GET() {
  const items = listDemoNotifications();

  return NextResponse.json({
    unreadCount: items.length,
    items
  });
}
