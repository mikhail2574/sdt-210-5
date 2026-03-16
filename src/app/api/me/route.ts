import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDemoProfile } from "@/lib/demo/demo-store";
import { staffSessionCookieName } from "@/lib/demo/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(staffSessionCookieName)?.value ?? "";
  const profile = getDemoProfile(token);

  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(profile);
}
