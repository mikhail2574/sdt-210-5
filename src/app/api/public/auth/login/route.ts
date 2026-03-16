import { NextResponse } from "next/server";

import { loginDemoCustomer } from "@/lib/demo/demo-store";
import { customerSessionCookieName } from "@/lib/demo/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    trackingCode: string;
    password: string;
  };
  const result = loginDemoCustomer(body.trackingCode, body.password);

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid tracking code or password."
        }
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json(result);
  response.cookies.set(customerSessionCookieName, result.applicationId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: result.expiresInSeconds
  });

  return response;
}
