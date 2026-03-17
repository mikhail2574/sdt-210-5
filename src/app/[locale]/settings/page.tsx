import { notFound } from "next/navigation";

import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { getBackofficeApplications, getBackofficeInvitations, getBackofficeTheme, getBackendFormRuntime, getServerStaffUser } from "@/lib/backend/server-data";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";
import { getOcrDemoJobs } from "@/services/ocr-demo-service";

type SettingsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await getMessages(locale as Locale);
  const user = await getServerStaffUser();
  const ocrJobs = getOcrDemoJobs();

  const backendSnapshot = user
    ? await (async () => {
        const [applicationsPayload, invitations, theme] = await Promise.all([
          getBackofficeApplications(user.tenantId),
          getBackofficeInvitations(user.tenantId),
          getBackofficeTheme(user.tenantId)
        ]);

        return {
          applications: applicationsPayload.total,
          invitations: invitations.length,
          ocrJobs: ocrJobs.length,
          theme
        };
      })()
    : await (async () => {
        const runtime = await getBackendFormRuntime("hausanschluss-demo");

        return {
          applications: 0,
          invitations: 0,
          ocrJobs: ocrJobs.length,
          theme: runtime.theme
        };
      })();

  return <SettingsPageClient backendSnapshot={backendSnapshot} />;
}
