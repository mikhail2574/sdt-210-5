import { NextResponse } from "next/server";

import { customerSessionCookieName } from "@/lib/demo/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(customerSessionCookieName, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0
  });

  return response;
}
