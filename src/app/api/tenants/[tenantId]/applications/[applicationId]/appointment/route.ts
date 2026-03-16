import { NextResponse } from "next/server";

import { scheduleDemoAppointment } from "@/lib/demo/demo-store";

type AppointmentRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function POST(request: Request, { params }: AppointmentRouteProps) {
  const { applicationId } = await params;
  const body = (await request.json()) as {
    scheduledAt: string;
    notes: string;
  };
  const updated = scheduleDemoAppointment(applicationId, body.scheduledAt, body.notes);

  if (!updated) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
