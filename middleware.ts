import createMiddleware from 'next-intl/middleware';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

/**
 * Pathname translations per Section 3 of the spec.
 * Internal route paths (file system) are the English names.
 * The middleware maps French external URLs to the same internal handlers.
 *
 * External FR URLs:  /fr/activites/[city]   /fr/saison/[slug]
 * Internal handler:  /fr/activities/[city]  /fr/seasonal/[slug]
 */
export const pathnames = {
  '/': '/',
  '/activities/[city]': {
    en: '/activities/[city]',
    fr: '/activites/[city]',
  },
  '/activities/[city]/[category]': {
    en: '/activities/[city]/[category]',
    fr: '/activites/[city]/[category]',
  },
  '/seasonal/[slug]': {
    en: '/seasonal/[slug]',
    fr: '/saison/[slug]',
  },
  '/guide/[slug]': '/guide/[slug]',
  '/about':   '/about',
  '/privacy': '/privacy',
  '/contact': '/contact',
} as const;

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  pathnames,
});

export const config = {
  // Match all paths except Next.js internals and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
