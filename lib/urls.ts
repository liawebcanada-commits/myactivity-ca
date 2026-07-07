/**
 * Locale-aware URL helpers for MyActivity.ca
 *
 * French uses distinct path segments per Section 3 of the spec:
 *   /en/activities/[city]         → /fr/activites/[city]
 *   /en/activities/[city]/[cat]   → /fr/activites/[city]/[cat]
 *   /en/seasonal/[slug]           → /fr/saison/[slug]
 *
 * City/category slugs are the same ASCII strings in both locales.
 * All URLs are lowercase, no trailing slashes, accents stripped in slug.
 */

import type { Locale, Season } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';

// ─── Path builders (return path only, no origin) ─────────────────────────────

export function homePath(locale: Locale): string {
  return `/${locale}`;
}

export function cityPath(locale: Locale, citySlug: string): string {
  return locale === 'fr'
    ? `/${locale}/activites/${citySlug}`
    : `/${locale}/activities/${citySlug}`;
}

export function categoryPath(
  locale: Locale,
  citySlug: string,
  categorySlug: string,
): string {
  return locale === 'fr'
    ? `/${locale}/activites/${citySlug}/${categorySlug}`
    : `/${locale}/activities/${citySlug}/${categorySlug}`;
}

/** Seasonal slug format: "{season}-{citySlug}", e.g. "winter-montreal" */
export function seasonalPath(
  locale: Locale,
  season: Season | string,
  citySlug: string,
): string {
  const slug = `${season}-${citySlug}`;
  return locale === 'fr'
    ? `/${locale}/saison/${slug}`
    : `/${locale}/seasonal/${slug}`;
}

export function guidePath(locale: Locale, slug: string): string {
  return `/${locale}/guide/${slug}`;
}

export function aboutPath(locale: Locale): string {
  return `/${locale}/about`;
}

export function privacyPath(locale: Locale): string {
  return `/${locale}/privacy`;
}

export function contactPath(locale: Locale): string {
  return `/${locale}/contact`;
}

// ─── Canonical URL builders (include origin) ─────────────────────────────────

export function canonicalHomeUrl(locale: Locale): string {
  return `${SITE_URL}${homePath(locale)}`;
}

export function canonicalCityUrl(locale: Locale, citySlug: string): string {
  return `${SITE_URL}${cityPath(locale, citySlug)}`;
}

export function canonicalCategoryUrl(
  locale: Locale,
  citySlug: string,
  categorySlug: string,
): string {
  return `${SITE_URL}${categoryPath(locale, citySlug, categorySlug)}`;
}

export function canonicalSeasonalUrl(
  locale: Locale,
  season: string,
  citySlug: string,
): string {
  return `${SITE_URL}${seasonalPath(locale, season, citySlug)}`;
}

export function canonicalGuideUrl(locale: Locale, slug: string): string {
  return `${SITE_URL}${guidePath(locale, slug)}`;
}

// ─── Alternate (hreflang) pair builders ───────────────────────────────────────

/**
 * Returns { canonical, en-CA, fr-CA, x-default } for the Next.js `alternates` metadata field.
 * Pass the resolved canonical URL for the current locale plus the pair of full canonical URLs.
 */
export function buildAlternateUrls(
  canonicalUrl: string,
  enUrl: string,
  frUrl: string,
) {
  return {
    canonical: canonicalUrl,
    languages: {
      'en-CA': enUrl,
      'fr-CA': frUrl,
      'x-default': enUrl, // x-default → EN per spec
    },
  };
}

export function cityAlternates(locale: Locale, citySlug: string) {
  return buildAlternateUrls(
    canonicalCityUrl(locale, citySlug),
    canonicalCityUrl('en', citySlug),
    canonicalCityUrl('fr', citySlug),
  );
}

export function categoryAlternates(
  locale: Locale,
  citySlug: string,
  categorySlug: string,
) {
  return buildAlternateUrls(
    canonicalCategoryUrl(locale, citySlug, categorySlug),
    canonicalCategoryUrl('en', citySlug, categorySlug),
    canonicalCategoryUrl('fr', citySlug, categorySlug),
  );
}

export function seasonalAlternates(
  locale: Locale,
  season: string,
  citySlug: string,
) {
  return buildAlternateUrls(
    canonicalSeasonalUrl(locale, season, citySlug),
    canonicalSeasonalUrl('en', season, citySlug),
    canonicalSeasonalUrl('fr', season, citySlug),
  );
}

export function homeAlternates(locale: Locale) {
  return buildAlternateUrls(
    canonicalHomeUrl(locale),
    canonicalHomeUrl('en'),
    canonicalHomeUrl('fr'),
  );
}

export function guideAlternates(locale: Locale, slug: string) {
  return buildAlternateUrls(
    canonicalGuideUrl(locale, slug),
    canonicalGuideUrl('en', slug),
    canonicalGuideUrl('fr', slug),
  );
}

// ─── Internal link helpers (other-locale mirror URL for LocaleSwitcher) ───────

export function mirrorPath(currentLocale: Locale, currentPath: string): string {
  const other = currentLocale === 'en' ? 'fr' : 'en';

  // Swap path prefix segment: /en/activities/ ↔ /fr/activites/
  return currentPath
    .replace(/^\/en\/activities\//, `/fr/activites/`)
    .replace(/^\/fr\/activites\//, `/en/activities/`)
    .replace(/^\/en\/seasonal\//, `/fr/saison/`)
    .replace(/^\/fr\/saison\//, `/en/seasonal/`)
    .replace(/^\/en\//, `/${other}/`)
    .replace(/^\/fr\//, `/${other}/`);
}
