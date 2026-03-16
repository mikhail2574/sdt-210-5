import { getDemoApplicationDetail } from "@/lib/demo/demo-store";

export function buildApplicationDownload(applicationId: string) {
  const application = getDemoApplicationDetail(applicationId);

  if (!application) {
    return null;
  }

  const lines = [
    "Stadtwerke Demo Application Export",
    `Application ID: ${application.applicationId}`,
    `Status: ${application.status}`,
    `Tracking code: ${application.trackingCode ?? "Not issued"}`,
    `Customer: ${application.customerSummary.name}`,
    `Address: ${application.customerSummary.address}`,
    "",
    "Page Data:",
    JSON.stringify(application.pageData, null, 2)
  ];

  return lines.join("\n");
}

export function buildApplicationsCsv() {
  const headers = ["applicationId", "trackingCode", "status", "createdAt", "customerName", "customerAddress"];
  const rows = [
    headers.join(",")
  ];

  for (const line of ["demo-application-1", "demo-application-2"]) {
    const application = getDemoApplicationDetail(line);

    if (!application) {
      continue;
    }

    rows.push(
      [
        application.applicationId,
        application.trackingCode ?? "",
        application.status,
        application.createdAt,
        escapeCsv(application.customerSummary.name),
        escapeCsv(application.customerSummary.address)
      ].join(",")
    );
  }

  return rows.join("\n");
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}
