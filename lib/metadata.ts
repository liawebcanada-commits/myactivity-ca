import type { Metadata } from 'next';
import type { Locale } from '@/types';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';

/**
 * Build the `alternates` block for Next.js Metadata.
 *
 * Every page must emit:
 *   - self-referencing canonical (locale-specific)
 *   - reciprocal hreflang en-CA / fr-CA
 *   - x-default pointing to the EN version
 *
 * This avoids the dual-URL indexing failure seen on AstrologySky.com.
 *
 * @param locale  Current page locale ('en' | 'fr')
 * @param path    Locale-agnostic path after the locale prefix, e.g. '/activities/montreal'
 */
export function buildAlternates(
  locale: Locale,
  path: string,
): Metadata['alternates'] {
  const canonical = `${SITE_URL}/${locale}${path}`;

  return {
    canonical,
    languages: {
      'en-CA': `${SITE_URL}/en${path}`,
      'fr-CA': `${SITE_URL}/fr${path}`,
      'x-default': `${SITE_URL}/en${path}`,
    },
  };
}

/**
 * Common Open Graph defaults to merge into per-page metadata.
 */
export function buildOpenGraphBase(params: {
  title: string;
  description: string;
  locale: Locale;
  path: string;
  imageUrl?: string;
}): Metadata['openGraph'] {
  const { title, description, locale, path, imageUrl } = params;
  const url = `${SITE_URL}/${locale}${path}`;

  return {
    title,
    description,
    url,
    siteName: 'MyActivity.ca',
    locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
    type: 'website',
    ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
  };
}

/**
 * Merge canonical + hreflang + OG into a single Metadata object.
 */
export function buildPageMetadata(params: {
  title: string;
  description: string;
  locale: Locale;
  path: string;
  imageUrl?: string;
  noindex?: boolean;
}): Metadata {
  const { title, description, locale, path, imageUrl, noindex } = params;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: buildOpenGraphBase({ title, description, locale, path, imageUrl }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
