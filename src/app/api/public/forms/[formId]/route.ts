import { NextResponse } from "next/server";

import { getBackendFormRuntime } from "@/lib/backend/public-api";
import { resolveLocalRuntimeFormId } from "@/lib/forms/demo-catalog";
import { getFormRuntime } from "@/lib/forms/runtime";

type FormRouteProps = {
  params: Promise<{
    formId: string;
  }>;
};

export async function GET(_: Request, { params }: FormRouteProps) {
  const { formId } = await params;

  try {
    const runtime = await getBackendFormRuntime(formId);
    return NextResponse.json(runtime);
  } catch {
    const runtime = getFormRuntime(resolveLocalRuntimeFormId(formId));
    return NextResponse.json(runtime);
  }
}
