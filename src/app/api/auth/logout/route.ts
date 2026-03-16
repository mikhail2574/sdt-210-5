import { NextResponse } from "next/server";

import { staffSessionCookieName } from "@/lib/demo/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffSessionCookieName, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0
  });

  return response;
}
