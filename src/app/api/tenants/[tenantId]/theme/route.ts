import { NextResponse } from "next/server";

import { getDemoTenantTheme, updateDemoTenantTheme } from "@/lib/demo/demo-store";
import type { ThemeConfig } from "@/lib/forms/types";

export async function GET() {
  return NextResponse.json(getDemoTenantTheme());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as ThemeConfig;
  return NextResponse.json(updateDemoTenantTheme(body));
}
