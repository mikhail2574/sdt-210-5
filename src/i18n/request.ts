import { getRequestConfig } from "next-intl/server";

import { defaultLocale, getMessages, isLocale } from "@/lib/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  const localeCandidate = await requestLocale;
  const locale = localeCandidate && isLocale(localeCandidate) ? localeCandidate : defaultLocale;

  return {
    locale,
    messages: await getMessages(locale)
  };
});
