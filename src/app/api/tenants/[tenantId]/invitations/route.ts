import { NextResponse } from "next/server";

import { createDemoInvitation, listDemoInvitations } from "@/lib/demo/demo-store";

export async function GET() {
  return NextResponse.json({
    items: listDemoInvitations()
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    role: string;
  };
  const invitation = createDemoInvitation(body.email, body.role);

  return NextResponse.json(invitation, { status: 201 });
}
