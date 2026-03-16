import { NextResponse } from "next/server";

import { loginDemoStaff } from "@/lib/demo/demo-store";
import { staffSessionCookieName } from "@/lib/demo/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    password: string;
  };
  const session = loginDemoStaff(body.email, body.password);

  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password."
        }
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json(session);
  response.cookies.set(staffSessionCookieName, session.accessToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8
  });

  return response;
}
