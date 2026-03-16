import { NextResponse } from "next/server";

import { proxyPublicApiRequest } from "@/lib/backend/public-api";
import { getValidationForPage, getNextWizardPageKey } from "@/lib/demo/public-flow";
import { getDraft, updateDraft } from "@/lib/forms/store";

type UpdatePageRouteProps = {
  params: Promise<{
    applicationId: string;
    pageKey: string;
  }>;
};

export async function PUT(request: Request, { params }: UpdatePageRouteProps) {
  const { applicationId, pageKey } = await params;
  const body = (await request.json()) as {
    data: Record<string, unknown>;
    clientRevision?: number;
  };

  try {
    const response = await proxyPublicApiRequest(`/applications/${applicationId}/pages/${pageKey}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });

    if (response.ok || response.status === 422 || response.status === 403) {
      return NextResponse.json(response.payload, { status: response.status });
    }
  } catch {}

  const currentDraft = getDraft(applicationId);

  if (!currentDraft) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  const nextPages = {
    ...currentDraft.pageData,
    [pageKey]: body.data
  };
  const validation = getValidationForPage(currentDraft.formId, pageKey, nextPages);

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

  const draft = updateDraft(applicationId, pageKey, body.data);

  if (!draft) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    applicationId: draft.applicationId,
    status: draft.status,
    nextPageKey: getNextWizardPageKey(pageKey),
    validation: {
      hardMissing: validation.hardMissing,
      softMissing: validation.softMissing
    }
  });
}
