import { NextResponse } from "next/server";

import { getFormRuntime } from "@/lib/forms/runtime";

type FormRouteProps = {
  params: Promise<{
    formId: string;
  }>;
};

export async function GET(_: Request, { params }: FormRouteProps) {
  const { formId } = await params;
  const runtime = getFormRuntime(formId);

  return NextResponse.json(runtime);
}
