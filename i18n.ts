import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './middleware';

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  const resolvedLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : 'en';

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
