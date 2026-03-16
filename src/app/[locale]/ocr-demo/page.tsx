import { notFound } from "next/navigation";

import { OcrDemoForm } from "@/components/ocr/OcrDemoForm";
import { getDemoOcrJobs } from "@/lib/demo/demo-store";
import { isLocale } from "@/lib/i18n";

type OcrDemoPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function OcrDemoPage({ params }: OcrDemoPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <OcrDemoForm jobs={getDemoOcrJobs()} />;
}
