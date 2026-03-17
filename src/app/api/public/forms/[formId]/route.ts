import { NextResponse } from "next/server";

import { getBackendFormRuntime } from "@/lib/backend/server-data";

type FormRouteProps = {
  params: Promise<{
    formId: string;
  }>;
};

export async function GET(_: Request, { params }: FormRouteProps) {
  const { formId } = await params;
  const runtime = await getBackendFormRuntime(formId);
  return NextResponse.json(runtime);
}
