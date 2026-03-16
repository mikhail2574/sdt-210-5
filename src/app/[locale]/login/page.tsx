import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerLoginForm } from "@/components/kundenportal/CustomerLoginForm";
import { PortalChrome } from "@/components/kundenportal/PortalChrome";
import { getResolvedFormRuntime } from "@/lib/demo/runtime";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type CustomerLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function CustomerLoginPage({ params }: CustomerLoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);
  const runtime = await getResolvedFormRuntime("hausanschluss-demo");

  return (
    <PortalChrome locale={locale as Locale} theme={runtime.theme}>
      <h1 className="wizard-page-title">{messages.customerLogin.title}</h1>
      <p className="wizard-page-description">{messages.customerLogin.description}</p>

      <CustomerLoginForm locale={locale as Locale} />

      <p className="helper-copy">
        {messages.customerLogin.demoHint} <strong>317-000-HA01016</strong> / <strong>DemoPass!2026</strong>
      </p>

      <Link className="inline-link" href={`/${locale}`}>
        {messages.customerLogin.backHome}
      </Link>
    </PortalChrome>
  );
}
