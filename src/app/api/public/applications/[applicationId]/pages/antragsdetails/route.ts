import { NextResponse } from "next/server";

import { proxyPublicApiRequest } from "@/lib/backend/public-api";
import { getDraft, updateDraft } from "@/lib/forms/store";
import { getPageSchema } from "@/lib/forms/runtime";
import { getSoftMissingFields, validateRequiredFields } from "@/lib/forms/validation";

type UpdateRouteProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function PUT(request: Request, { params }: UpdateRouteProps) {
  const { applicationId } = await params;
  const body = (await request.json()) as {
    data: Record<string, unknown>;
  };

  try {
    const response = await proxyPublicApiRequest(`/applications/${applicationId}/pages/antragsdetails`, {
      method: "PUT",
      body: JSON.stringify(body)
    });

    if (response.ok || response.status === 422 || response.status === 403) {
      return NextResponse.json(response.payload, { status: response.status });
    }
  } catch {}

  const currentDraft = getDraft(applicationId);

  if (!currentDraft) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const page = getPageSchema(currentDraft.formId, "antragsdetails");

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

  updateDraft(applicationId, "antragsdetails", values);

  const softMissing = getSoftMissingFields(page, values).map((field) => field.id);

  return NextResponse.json({
    applicationId,
    status: "DRAFT",
    nextPageKey: "anschlussort",
    validation: {
      hardMissing: [],
      softMissing
    }
  });
}
