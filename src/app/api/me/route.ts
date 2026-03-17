import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requestBackofficeJson } from "@/lib/backend/api-gateway";
import { staffSessionCookieName } from "@/lib/demo/session";

export async function GET() {
  const cookieStore = await cookies();

  if (!cookieStore.get(staffSessionCookieName)?.value) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const profile = await requestBackofficeJson<{
      id: string;
      email: string;
      displayName: string;
      role: string;
      tenantId: string;
      tenants: Array<{
        tenantId: string;
        role: string;
      }>;
    }>("/me");

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json((error as { payload?: unknown }).payload ?? { error: "unauthorized" }, {
        status: Number((error as { status?: number }).status ?? 500)
      });
    }

    throw error;
  }
}
