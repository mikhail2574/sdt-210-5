import Link from "next/link";
import { getMessages, isLocale } from "@/lib/i18n";

type AnschlussortPlaceholderProps = {
  params: Promise<{
    locale: string;
    formId: string;
  }>;
  searchParams: Promise<{
    applicationId?: string;
  }>;
};

export default async function AnschlussortPlaceholder({ params, searchParams }: AnschlussortPlaceholderProps) {
  const { locale, formId } = await params;
  const { applicationId } = await searchParams;

  if (!isLocale(locale)) {
    return null;
  }

  const messages = await getMessages(locale);

  return (
    <main className="home-shell">
      <div className="placeholder-card">
        <h1>{messages.placeholder.anschlussort.title}</h1>
        <p>{messages.placeholder.anschlussort.description}</p>
        {applicationId ? <p>{applicationId}</p> : null}
        <Link className="secondary-button" href={`/${locale}/forms/${formId}/antragsdetails${applicationId ? `?applicationId=${applicationId}` : ""}`}>
          {messages.placeholder.anschlussort.backLink}
        </Link>
      </div>
    </main>
  );
}
