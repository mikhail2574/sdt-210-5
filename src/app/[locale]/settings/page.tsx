import { notFound } from "next/navigation";

import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { getDemoOcrJobs, getDemoTenantTheme, listDemoApplications, listDemoInvitations } from "@/lib/demo/demo-store";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

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

  return (
    <SettingsPageClient
      backendSnapshot={{
        applications: listDemoApplications().length,
        invitations: listDemoInvitations().length,
        ocrJobs: getDemoOcrJobs().length,
        theme: getDemoTenantTheme()
      }}
    />
  );
}
