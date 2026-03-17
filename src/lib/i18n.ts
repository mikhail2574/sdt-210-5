import { cache } from "react";

export const locales = ["de", "en", "tr", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const getMessages = cache(async function getMessages(locale: Locale) {
  const messages = await import(`../../messages/${locale}.json`);
  return messages.default;
});
