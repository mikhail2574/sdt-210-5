import { createBrowserFrontendApi, FrontendApiError, isFrontendApiError, type FetchLike } from "@/lib/frontend/api-client";
import { getBrowserApiBasePath } from "@/services/api-config";

function resolveApiInput(input: RequestInfo | URL) {
  if (typeof input !== "string") {
    return input;
  }

  if (!input.startsWith("/")) {
    return input;
  }

  return `${getBrowserApiBasePath()}${input}`;
}

const configuredFetch: FetchLike = (input, init) => fetch(resolveApiInput(input), init);

export const appApi = createBrowserFrontendApi(configuredFetch);

export { FrontendApiError, isFrontendApiError };
