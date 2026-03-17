import { NextResponse } from "next/server";

import { requestBackendJson } from "@/lib/backend/api-gateway";
import { staffSessionCookieName } from "@/lib/demo/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    password: string;
  };
  try {
    const session = await requestBackendJson<{
      accessToken: string;
      tenantId: string;
      user: {
        id: string;
        email: string;
        displayName: string;
        role: string;
        tenantId: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });

    const response = NextResponse.json(session);
    response.cookies.set(staffSessionCookieName, session.accessToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      const status = Number((error as { status?: number }).status ?? 500);
      const payload = (error as { payload?: unknown }).payload ?? {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password."
        }
      };
      return NextResponse.json(payload, { status });
    }

    throw error;
  }
}
