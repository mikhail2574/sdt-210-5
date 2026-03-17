import { NextResponse } from "next/server";

import { isBackendConnectionError, requestBackendJson } from "@/lib/backend/api-gateway";
import { staffSessionCookieName } from "@/lib/demo/session";

type AcceptInvitationRouteProps = {
  params: Promise<{
    inviteId: string;
  }>;
};

export async function POST(request: Request, { params }: AcceptInvitationRouteProps) {
  const { inviteId } = await params;
  const body = (await request.json()) as {
    displayName: string;
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
    }>(`/invitations/${inviteId}/accept`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    const response = NextResponse.json(session);
    response.cookies.set(staffSessionCookieName, session.accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax"
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
      return NextResponse.json((error as { payload?: unknown }).payload ?? {}, {
        status: Number((error as { status?: number }).status ?? 500)
      });
    }

    throw error;
  }
}
