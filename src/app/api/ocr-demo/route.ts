import { NextResponse } from "next/server";

import { createDemoOcrJob, getDemoOcrJobs } from "@/lib/demo/demo-store";

export async function GET() {
  return NextResponse.json({
    items: getDemoOcrJobs()
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fileName: string;
    sourceText: string;
  };

  return NextResponse.json(createDemoOcrJob(body.fileName, body.sourceText), { status: 201 });
}
