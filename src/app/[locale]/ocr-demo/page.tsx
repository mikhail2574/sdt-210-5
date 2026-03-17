import { notFound } from "next/navigation";

import { OcrDemoForm } from "@/components/ocr/OcrDemoForm";
import { isLocale } from "@/lib/i18n";
import { getOcrDemoJobs } from "@/services/ocr-demo-service";

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

  return <OcrDemoForm jobs={getOcrDemoJobs()} />;
}
