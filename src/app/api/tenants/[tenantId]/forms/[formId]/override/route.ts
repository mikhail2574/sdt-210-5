import { NextResponse } from "next/server";

import { getDemoFormOverride, updateDemoFormOverride } from "@/lib/demo/demo-store";
import type { FormOverrideOperation } from "@/lib/forms/types";

type FormOverrideRouteProps = {
  params: Promise<{
    formId: string;
  }>;
};

export async function GET(_: Request, { params }: FormOverrideRouteProps) {
  const { formId } = await params;
  return NextResponse.json({
    formId,
    operations: getDemoFormOverride(formId)
  });
}

export async function PUT(request: Request, { params }: FormOverrideRouteProps) {
  const { formId } = await params;
  const body = (await request.json()) as {
    operations: FormOverrideOperation[];
  };

  return NextResponse.json({
    formId,
    operations: updateDemoFormOverride(formId, body.operations)
  });
}
