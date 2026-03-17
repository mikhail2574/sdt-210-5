import type {
  FrontendApi,
  IssuedCredential,
  SavePublicApplicationPageResponse,
  ValidationErrorPayload
} from "@/lib/frontend/api-contract";

type SavePageRouteResponse = {
  applicationId?: string;
  nextPageKey?: string;
  status?: string;
  validation?: SavePublicApplicationPageResponse["validation"];
};

type SubmitApplicationRouteResponse = {
  trackingCode?: string;
  password?: string;
};

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

function createJsonRequestInit(method: string, body?: unknown): RequestInit {
  if (body === undefined) {
    return { method };
  }

  return {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

async function parseJson<TPayload>(response: Response) {
  return (await response.json().catch(() => null)) as TPayload | null;
}

export class FrontendApiError<TPayload = unknown> extends Error {
  readonly name = "FrontendApiError";

  constructor(
    readonly status: number,
    readonly path: string,
    readonly payload: TPayload
  ) {
    super(`Frontend API request failed with status ${status} for ${path}`);
  }
}

export function isFrontendApiError<TPayload = unknown>(error: unknown): error is FrontendApiError<TPayload> {
  return error instanceof FrontendApiError;
}

async function requestJson<TSuccess, TError = unknown>(
  fetchImpl: FetchLike,
  path: string,
  init: RequestInit
) {
  const response = await fetchImpl(path, init);
  const payload = await parseJson<TSuccess | TError>(response);

  if (!response.ok) {
    throw new FrontendApiError(response.status, path, payload as TError);
  }

  if (payload === null) {
    throw new Error(`Frontend API returned no JSON for ${path}`);
  }

  return payload as TSuccess;
}

function normalizeSavePageResponse(
  payload: SavePageRouteResponse,
  fallbackApplicationId?: string | null
): SavePublicApplicationPageResponse {
  if (!payload.nextPageKey) {
    throw new Error("Public application save response is missing nextPageKey.");
  }

  const applicationId = payload.applicationId ?? fallbackApplicationId;

  if (!applicationId) {
    throw new Error("Public application save response is missing applicationId.");
  }

  return {
    applicationId,
    nextPageKey: payload.nextPageKey,
    status: payload.status,
    validation: payload.validation
  };
}

function normalizeIssuedCredential(applicationId: string, payload: SubmitApplicationRouteResponse): IssuedCredential {
  if (!payload.trackingCode || !payload.password) {
    throw new Error("Public application submit response is incomplete.");
  }

  return {
    applicationId,
    trackingCode: payload.trackingCode,
    password: payload.password
  };
}

export function createBrowserFrontendApi(fetchImpl: FetchLike = defaultFetch): FrontendApi {
  return {
    customerAuth: {
      login(input) {
        return requestJson(fetchImpl, "/api/public/auth/login", createJsonRequestInit("POST", input));
      },
      async logout() {
        await requestJson(fetchImpl, "/api/public/auth/logout", createJsonRequestInit("POST"));
      }
    },
    staffAuth: {
      login(input) {
        return requestJson(fetchImpl, "/api/auth/login", createJsonRequestInit("POST", input));
      },
      acceptInvitation(inviteId, input) {
        return requestJson(fetchImpl, `/api/invitations/${inviteId}/accept`, createJsonRequestInit("POST", input));
      },
      async logout() {
        await requestJson(fetchImpl, "/api/auth/logout", createJsonRequestInit("POST"));
      }
    },
    publicApplications: {
      async savePage(input) {
        async function createDraftFromCurrentPage() {
          const payload = await requestJson<SavePageRouteResponse, ValidationErrorPayload>(
            fetchImpl,
            `/api/public/forms/${input.formId}/applications:draft`,
            createJsonRequestInit("POST", {
              pageKey: input.pageKey,
              data: input.data
            })
          );

          return normalizeSavePageResponse(payload);
        }

        if (!input.applicationId) {
          return createDraftFromCurrentPage();
        }

        try {
          const payload = await requestJson<SavePageRouteResponse, ValidationErrorPayload>(
            fetchImpl,
            `/api/public/applications/${input.applicationId}/pages/${input.pageKey}`,
            createJsonRequestInit("PUT", {
              data: input.data,
              clientRevision: input.clientRevision ?? Date.now()
            })
          );

          return normalizeSavePageResponse(payload, input.applicationId);
        } catch (error) {
          if (isFrontendApiError(error) && error.status === 404) {
            return createDraftFromCurrentPage();
          }

          throw error;
        }
      },
      async submitApplication(applicationId, input) {
        const payload = await requestJson<SubmitApplicationRouteResponse>(
          fetchImpl,
          `/api/public/applications/${applicationId}/submit`,
          createJsonRequestInit("POST", input)
        );

        return normalizeIssuedCredential(applicationId, payload);
      }
    },
    backoffice: {
      async inviteUser(tenantId, input) {
        await requestJson(fetchImpl, `/api/tenants/${tenantId}/invitations`, createJsonRequestInit("POST", input));
      },
      async updateTheme(tenantId, theme) {
        await requestJson(fetchImpl, `/api/tenants/${tenantId}/theme`, createJsonRequestInit("PUT", theme));
      },
      async updateFormOverride(tenantId, formId, operations) {
        await requestJson(
          fetchImpl,
          `/api/tenants/${tenantId}/forms/${formId}/override`,
          createJsonRequestInit("PUT", { operations })
        );
      },
      async markApplicationRead(tenantId, applicationId) {
        await requestJson(
          fetchImpl,
          `/api/tenants/${tenantId}/applications/${applicationId}/mark-read`,
          createJsonRequestInit("POST")
        );
      },
      async transitionApplication(tenantId, applicationId, input) {
        await requestJson(
          fetchImpl,
          `/api/tenants/${tenantId}/applications/${applicationId}/transition`,
          createJsonRequestInit("POST", input)
        );
      },
      async scheduleAppointment(tenantId, applicationId, input) {
        await requestJson(
          fetchImpl,
          `/api/tenants/${tenantId}/applications/${applicationId}/appointment`,
          createJsonRequestInit("POST", input)
        );
      },
      async saveApplicationEdits(tenantId, applicationId, pageKey, input) {
        await requestJson(
          fetchImpl,
          `/api/tenants/${tenantId}/applications/${applicationId}/pages/${pageKey}`,
          createJsonRequestInit("PATCH", input)
        );
      }
    },
    ocrDemo: {
      createJob(input) {
        return requestJson(fetchImpl, "/api/ocr-demo", createJsonRequestInit("POST", input));
      }
    }
  };
}
