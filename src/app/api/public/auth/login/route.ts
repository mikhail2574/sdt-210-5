import { NextResponse } from "next/server";

import { isBackendConnectionError, requestPublicBackendJson } from "@/lib/backend/api-gateway";
import { customerSessionCookieName } from "@/lib/demo/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    trackingCode: string;
    password: string;
  };
  try {
    const result = await requestPublicBackendJson<{
      applicationId: string;
      status: string;
      expiresInSeconds: number;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });

    const response = NextResponse.json(result);
    response.cookies.set(customerSessionCookieName, result.applicationId, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: result.expiresInSeconds
    });

    return response;
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(
        {
          error: {
            code: "BACKEND_UNAVAILABLE",
            message: "Backend API is unavailable. Start it with 'pnpm run api:dev'."
          }
        },
        { status: 503 }
      );
    }

    if (error instanceof Error && "status" in error) {
      const status = Number((error as { status?: number }).status ?? 500);
      const payload = (error as { payload?: unknown }).payload ?? {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid tracking code or password."
        }
      };
      return NextResponse.json(payload, { status });
    }

    throw error;
  }
}
