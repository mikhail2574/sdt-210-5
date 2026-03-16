import { notFound } from "next/navigation";

import { getMessages, isLocale, type Locale } from "@/lib/i18n";

type AboutPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);

  return (
    <main>
      <h1>{messages.aboutPage.title}</h1>
      <p>{messages.aboutPage.description}</p>

      <section>
        <h2>{messages.aboutPage.assemblyTitle}</h2>
        <p>{messages.aboutPage.assemblyDescription}</p>
      </section>

      <section>
        <h2>{messages.aboutPage.architectureTitle}</h2>
        <pre>
          {JSON.stringify(
            {
              frontend: "Next.js App Router + React + Zustand + react-hook-form",
              backend: "Custom Node/Next route handlers with filesystem-backed JSON persistence",
              auth: "Cookie-based customer and staff sessions",
              services: ["src/services/api.ts", "src/services/auth.ts", "src/services/demo-app-service.ts"]
            },
            null,
            2
          )}
        </pre>
      </section>
    </main>
  );
}
