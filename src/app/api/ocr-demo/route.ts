import { NextResponse } from "next/server";

import { createOcrDemoJob, getOcrDemoJobs } from "@/services/ocr-demo-service";

export async function GET() {
  return NextResponse.json({
    items: getOcrDemoJobs()
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fileName: string;
    sourceText: string;
  };

  return NextResponse.json(createOcrDemoJob(body.fileName, body.sourceText), { status: 201 });
}
