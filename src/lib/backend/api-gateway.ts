import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { staffSessionCookieName } from "@/lib/demo/session";

const backendApiBaseUrl =
  process.env.BACKEND_API_BASE_URL ??
  process.env.PUBLIC_API_BASE_URL?.replace(/\/public$/, "") ??
  "http://127.0.0.1:3001/api";

export class BackendApiError<TPayload = unknown> extends Error {
  readonly name = "BackendApiError";

  constructor(
    readonly status: number,
    readonly path: string,
    readonly payload: TPayload
  ) {
    super(`Backend API request failed with status ${status} for ${path}`);
  }
}

export class BackendConnectionError extends Error {
  readonly name = "BackendConnectionError";

  constructor(
    readonly url: string,
    readonly originalError?: unknown
  ) {
    super(`BACKEND_UNAVAILABLE:${url}`);
  }
}

export function getBackendApiBaseUrl() {
  return backendApiBaseUrl;
}

export function getPublicApiBaseUrl() {
  return `${backendApiBaseUrl}/public`;
}

export function isBackendConnectionError(error: unknown): error is BackendConnectionError {
  return error instanceof BackendConnectionError;
}

function createHeaders(initHeaders?: HeadersInit, hasBody = false) {
  const headers = new Headers(initHeaders);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function parseJson<TPayload>(response: Response) {
  return (await response.json().catch(() => null)) as TPayload | null;
}

async function readResponseBuffer(response: Response) {
  return Buffer.from(await response.arrayBuffer());
}

function buildApiUrl(pathname: string) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

  return `${backendApiBaseUrl}${pathname}`;
}

export async function requestBackend(pathname: string, init?: RequestInit) {
  const hasBody = init?.body !== undefined;
  const url = buildApiUrl(pathname);

  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      headers: createHeaders(init?.headers, hasBody)
    });
  } catch (error) {
    throw new BackendConnectionError(url, error);
  }
}

export async function requestPublicBackend(pathname: string, init?: RequestInit) {
  return requestBackend(`/public${pathname}`, init);
}

export async function requestBackendJson<TSuccess, TError = unknown>(pathname: string, init?: RequestInit) {
  const response = await requestBackend(pathname, init);
  const payload = await parseJson<TSuccess | TError>(response);

  if (!response.ok) {
    throw new BackendApiError(response.status, pathname, payload as TError);
  }

  if (payload === null) {
    throw new Error(`Backend API returned no JSON for ${pathname}`);
  }

  return payload as TSuccess;
}

export async function requestPublicBackendJson<TSuccess, TError = unknown>(pathname: string, init?: RequestInit) {
  const response = await requestPublicBackend(pathname, init);
  const payload = await parseJson<TSuccess | TError>(response);

  if (!response.ok) {
    throw new BackendApiError(response.status, pathname, payload as TError);
  }

  if (payload === null) {
    throw new Error(`Backend API returned no JSON for /public${pathname}`);
  }

  return payload as TSuccess;
}

export async function withStaffAuthorization(init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get(staffSessionCookieName)?.value;
  const headers = createHeaders(init?.headers, init?.body !== undefined);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return {
    ...init,
    headers
  } satisfies RequestInit;
}

export async function requestBackofficeJson<TSuccess, TError = unknown>(pathname: string, init?: RequestInit) {
  return requestBackendJson<TSuccess, TError>(pathname, await withStaffAuthorization(init));
}

function copyResponseHeaders(source: Response) {
  const headers = new Headers();

  for (const headerName of ["Content-Type", "Content-Disposition", "Cache-Control"]) {
    const value = source.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function createUnavailablePayload() {
  return {
    error: {
      code: "BACKEND_UNAVAILABLE",
      message: `Backend API is unavailable at ${backendApiBaseUrl}. Start it with 'pnpm run api:dev'.`
    }
  };
}

export async function proxyBackendJson(pathname: string, init?: RequestInit) {
  try {
    const response = await requestBackend(pathname, init);
    const payload = await parseJson<unknown>(response);
    return NextResponse.json(payload ?? {}, { status: response.status });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(createUnavailablePayload(), { status: 503 });
    }

    throw error;
  }
}

export async function proxyPublicBackendJson(pathname: string, init?: RequestInit) {
  try {
    const response = await requestPublicBackend(pathname, init);
    const payload = await parseJson<unknown>(response);
    return NextResponse.json(payload ?? {}, { status: response.status });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(createUnavailablePayload(), { status: 503 });
    }

    throw error;
  }
}

export async function proxyBackofficeJson(pathname: string, init?: RequestInit) {
  try {
    const response = await requestBackend(pathname, await withStaffAuthorization(init));
    const payload = await parseJson<unknown>(response);
    return NextResponse.json(payload ?? {}, { status: response.status });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(createUnavailablePayload(), { status: 503 });
    }

    throw error;
  }
}

export async function proxyBackendBinary(pathname: string, init?: RequestInit) {
  try {
    const response = await requestBackend(pathname, init);
    return new NextResponse(await readResponseBuffer(response), {
      status: response.status,
      headers: copyResponseHeaders(response)
    });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(createUnavailablePayload(), { status: 503 });
    }

    throw error;
  }
}

export async function proxyPublicBackendBinary(pathname: string, init?: RequestInit) {
  try {
    const response = await requestPublicBackend(pathname, init);
    return new NextResponse(await readResponseBuffer(response), {
      status: response.status,
      headers: copyResponseHeaders(response)
    });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(createUnavailablePayload(), { status: 503 });
    }

    throw error;
  }
}

export async function proxyBackofficeBinary(pathname: string, init?: RequestInit) {
  try {
    const response = await requestBackend(pathname, await withStaffAuthorization(init));
    return new NextResponse(await readResponseBuffer(response), {
      status: response.status,
      headers: copyResponseHeaders(response)
    });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return NextResponse.json(createUnavailablePayload(), { status: 503 });
    }

    throw error;
  }
}
