import Link from "next/link";

import { getMessages, isLocale } from "@/lib/i18n";

type LocaleHomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return null;
  }

  const messages = await getMessages(locale);

  return (
    <main className="home-shell">
      <div className="home-card">
        <h1>{messages.home.title}</h1>
        <p>{messages.home.description}</p>
        <div className="home-actions">
          <Link className="primary-button" href={`/${locale}/forms/hausanschluss-demo/antragsdetails`}>
            {messages.home.demoLink}
          </Link>
          <Link className="secondary-button" href={`/${locale}/forms/hausanschluss-soft-demo/antragsdetails`}>
            {messages.home.softLink}
          </Link>
        </div>
      </div>
    </main>
  );
}
