"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePortalApp } from "@/hooks/usePortalApp";

type OcrDemoFormProps = {
  jobs: Array<{
    id: string;
    fileName: string;
    sourceText: string;
    extractedText: string;
    suggestedValue: string | null;
    createdAt: string;
  }>;
};

export function OcrDemoForm({ jobs }: OcrDemoFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const { error, loading, runOcrDemo } = usePortalApp();
  const [fileName, setFileName] = useState("meter-photo-2026-03-17.jpg");
  const [sourceText, setSourceText] = useState("Meter reading 48217 kWh");

  return (
    <main>
      <h1>{t("ocrDemo.title")}</h1>
      <p>{t("ocrDemo.description")}</p>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          try {
            await runOcrDemo({
              fileName,
              sourceText
            });
            router.refresh();
          } catch {}
        }}
      >
        <label htmlFor="ocr-file-name">{t("ocrDemo.fileName")}</label>
        <input id="ocr-file-name" onChange={(event) => setFileName(event.target.value)} value={fileName} />

        <label htmlFor="ocr-source-text">{t("ocrDemo.sourceText")}</label>
        <textarea id="ocr-source-text" onChange={(event) => setSourceText(event.target.value)} rows={6} value={sourceText} />

        {error ? <p>{t("ocrDemo.error")}</p> : null}

        <button disabled={loading} type="submit">
          {loading ? t("ocrDemo.running") : t("ocrDemo.submit")}
        </button>
      </form>

      <section>
        <h2>{t("ocrDemo.recordsTitle")}</h2>
        {jobs.length === 0 ? <p>{t("ocrDemo.noRecords")}</p> : null}
        {jobs.map((job) => (
          <article key={job.id}>
            <h3>{job.fileName}</h3>
            <pre>{JSON.stringify(job, null, 2)}</pre>
          </article>
        ))}
      </section>
    </main>
  );
}
