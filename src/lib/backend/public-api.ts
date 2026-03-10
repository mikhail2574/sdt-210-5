import { type FormRuntime } from "@/lib/forms/types";
import { resolveBackendFormId } from "@/lib/forms/demo-catalog";

const publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001/api/public";

async function parseProxyResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as unknown;

  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

export async function getBackendFormRuntime(formId: string): Promise<FormRuntime> {
  const backendFormId = resolveBackendFormId(formId);
  const response = await fetch(`${publicApiBaseUrl}/forms/${backendFormId}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`public_form_runtime_failed:${response.status}`);
  }

  return (await response.json()) as FormRuntime;
}

export async function proxyPublicApiRequest(pathname: string, init?: RequestInit) {
  const response = await fetch(`${publicApiBaseUrl}${pathname}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  return parseProxyResponse(response);
}
