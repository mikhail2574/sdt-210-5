"use client";

type LocaleErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function LocaleErrorPage({ error, reset }: LocaleErrorPageProps) {
  const backendUnavailable =
    error.name === "BackendConnectionError" || error.message.includes("BACKEND_UNAVAILABLE");

  return (
    <main style={{ margin: "0 auto", maxWidth: 720, padding: "48px 24px" }}>
      <h1>{backendUnavailable ? "Backend is not running" : "Something went wrong"}</h1>
      <p>
        {backendUnavailable
          ? "This page needs the API server on http://127.0.0.1:3001/api. Start it with 'pnpm run api:dev', then retry."
          : "The request failed before the page could render. Try again after checking the server logs."}
      </p>
      <button onClick={() => reset()} type="button">
        Retry
      </button>
      {!backendUnavailable ? <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{error.message}</pre> : null}
    </main>
  );
}
