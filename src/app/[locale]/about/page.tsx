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
              backend: "NestJS + TypeORM + PostgreSQL, proxied through Next.js route handlers",
              auth: "Cookie-backed staff and customer sessions bridged to backend tokens and application access",
              services: ["src/services/api.ts", "src/services/auth.ts", "apps/api/src/modules/public-applications/services/*"]
            },
            null,
            2
          )}
        </pre>
      </section>
    </main>
  );
}
