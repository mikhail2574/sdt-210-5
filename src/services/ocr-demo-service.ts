import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type OcrDemoJob = {
  id: string;
  fileName: string;
  sourceText: string;
  extractedText: string;
  suggestedValue: string | null;
  createdAt: string;
};

function getOcrDemoDataFilePath() {
  return process.env.OCR_DEMO_DATA_FILE_PATH ?? path.join(process.cwd(), ".data", "ocr-demo-jobs.json");
}

function readJobs() {
  const filePath = getOcrDemoDataFilePath();

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as OcrDemoJob[];
  } catch {
    return [];
  }
}

function writeJobs(jobs: OcrDemoJob[]) {
  const filePath = getOcrDemoDataFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(jobs, null, 2));
}

function deriveSuggestedValue(sourceText: string) {
  const match = sourceText.match(/\d+(?:[.,]\d+)?/);
  return match?.[0] ?? null;
}

export function getOcrDemoJobs() {
  return readJobs();
}

export function createOcrDemoJob(fileName: string, sourceText: string) {
  const nextJob: OcrDemoJob = {
    id: randomUUID(),
    fileName,
    sourceText,
    extractedText: sourceText.trim(),
    suggestedValue: deriveSuggestedValue(sourceText),
    createdAt: new Date().toISOString()
  };

  writeJobs([nextJob, ...readJobs()]);
  return nextJob;
}
