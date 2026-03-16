import { notFound } from "next/navigation";

import { BackofficeLoginForm } from "@/components/backoffice/BackofficeLoginForm";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type BackofficeLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function BackofficeLoginPage({ params }: BackofficeLoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);

  return (
    <main className="backoffice-shell">
      <div className="backoffice-container">
        <section className="backoffice-panel auth-panel">
          <h1>{messages.backoffice.loginTitle}</h1>
          <p>{messages.backoffice.loginDescription}</p>
          <BackofficeLoginForm locale={locale as Locale} />
        </section>
      </div>
    </main>
  );
}
