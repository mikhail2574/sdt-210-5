import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppNavigation } from "@/components/AppNavigation";
import { HtmlLangSync } from "@/components/HtmlLangSync";
import { FrontendApiProvider } from "@/lib/frontend/api-provider";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FrontendApiProvider>
        <AppNavigation locale={locale as Locale} />
        <HtmlLangSync locale={locale} />
        {children}
      </FrontendApiProvider>
    </NextIntlClientProvider>
  );
}
