import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './middleware';

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate locale from request (next-intl v3.22+ API)
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }
  const resolvedLocale = locale as Locale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
