import { describe, expect, it, vi } from "vitest";

import { FrontendApiError, createBrowserFrontendApi, isFrontendApiError } from "@/lib/frontend/api-client";
import type { ValidationErrorPayload } from "@/lib/frontend/api-contract";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("frontend API client", () => {
  it("creates a new public draft through the typed API interface", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        applicationId: "app-123",
        nextPageKey: "anschlussort"
      })
    );
    const api = createBrowserFrontendApi(fetchMock);

    const result = await api.publicApplications.savePage({
      formId: "hausanschluss-demo",
      pageKey: "antragsdetails",
      data: {
        selectedMedia: ["strom"]
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/forms/hausanschluss-demo/applications:draft",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          pageKey: "antragsdetails",
          data: {
            selectedMedia: ["strom"]
          }
        })
      })
    );
    expect(result).toEqual({
      applicationId: "app-123",
      nextPageKey: "anschlussort",
      status: undefined,
      validation: undefined
    });
  });

  it("updates an existing public draft and preserves the known application id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        nextPageKey: "anschlussort",
        validation: {
          softMissing: []
        }
      })
    );
    const api = createBrowserFrontendApi(fetchMock);

    const result = await api.publicApplications.savePage({
      applicationId: "app-existing",
      formId: "hausanschluss-demo",
      pageKey: "antragsdetails",
      data: {
        selectedMedia: ["gas"]
      },
      clientRevision: 42
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/applications/app-existing/pages/antragsdetails",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: {
            selectedMedia: ["gas"]
          },
          clientRevision: 42
        })
      })
    );
    expect(result.applicationId).toBe("app-existing");
    expect(result.nextPageKey).toBe("anschlussort");
  });

  it("surfaces validation failures as typed API errors", async () => {
    const payload: ValidationErrorPayload = {
      error: {
        code: "VALIDATION_FAILED",
        details: [
          {
            fieldPath: "antragsdetails.message",
            labelKey: "fields.message.label",
            messageKey: "validation.requiredField"
          }
        ]
      }
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload, 422));
    const api = createBrowserFrontendApi(fetchMock);

    try {
      await api.publicApplications.savePage({
        applicationId: "app-existing",
        formId: "hausanschluss-demo",
        pageKey: "antragsdetails",
        data: {}
      });
      throw new Error("expected savePage to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(FrontendApiError);
      expect(isFrontendApiError<ValidationErrorPayload>(error)).toBe(true);

      if (!isFrontendApiError<ValidationErrorPayload>(error)) {
        throw error;
      }

      expect(error.status).toBe(422);
      expect(error.payload).toEqual(payload);
    }
  });
});
