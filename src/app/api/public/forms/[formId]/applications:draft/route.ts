import { NextResponse } from "next/server";

import { createDraft } from "@/lib/forms/store";
import { getPageSchema } from "@/lib/forms/runtime";
import { getSoftMissingFields, normalizeValues, validateRequiredFields } from "@/lib/forms/validation";

type DraftRouteProps = {
  params: Promise<{
    formId: string;
  }>;
};

export async function POST(request: Request, { params }: DraftRouteProps) {
  const { formId } = await params;
  const body = (await request.json()) as {
    pageKey: string;
    data: Record<string, unknown>;
  };
  const page = getPageSchema(formId, body.pageKey);

  if (!page) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }

  const { values, errors } = validateRequiredFields(page, body.data);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          details: errors
        }
      },
      { status: 422 }
    );
  }

  const draft = createDraft(formId, body.pageKey, normalizeValues(values));
  const softMissing = getSoftMissingFields(page, values).map((field) => field.id);

  return NextResponse.json({
    applicationId: draft.applicationId,
    status: "DRAFT",
    nextPageKey: "anschlussort",
    validation: {
      hardMissing: [],
      softMissing
    }
  });
}
