import { NextResponse } from "next/server";

import { proxyPublicApiRequest } from "@/lib/backend/public-api";
import { getValidationForPage, getNextWizardPageKey } from "@/lib/demo/public-flow";
import { resolveBackendFormId, resolveLocalRuntimeFormId } from "@/lib/forms/demo-catalog";
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

  try {
    const response = await proxyPublicApiRequest(`/forms/${resolveBackendFormId(formId)}/applications:draft`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    if (response.ok || response.status === 422 || response.status === 403) {
      return NextResponse.json(response.payload, { status: response.status });
    }
  } catch {}

  const localFormId = resolveLocalRuntimeFormId(formId);
  const page = getPageSchema(localFormId, body.pageKey);

  if (!page) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }

  if (body.pageKey !== "antragsdetails") {
    const pages = {
      [body.pageKey]: body.data
    };
    const validation = getValidationForPage(localFormId, body.pageKey, pages);

    if (validation.hardMissing.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            details: validation.hardMissing
          }
        },
        { status: 422 }
      );
    }

    const draft = createDraft(localFormId, body.pageKey, body.data);

    return NextResponse.json({
      applicationId: draft.applicationId,
      status: "DRAFT",
      nextPageKey: getNextWizardPageKey(body.pageKey),
      validation: {
        hardMissing: validation.hardMissing,
        softMissing: validation.softMissing
      }
    });
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

  const draft = createDraft(localFormId, body.pageKey, normalizeValues(values));
  const softMissing = getSoftMissingFields(page, values).map((field) => ({
    fieldPath: `antragsdetails.${field.id}`,
    kind: "field",
    labelKey: field.labelI18nKey,
    messageKey: "validation.requiredField",
    pageKey: "antragsdetails"
  }));

  return NextResponse.json({
    applicationId: draft.applicationId,
    status: "DRAFT",
    nextPageKey: getNextWizardPageKey(body.pageKey),
    validation: {
      hardMissing: [],
      softMissing
    }
  });
}
