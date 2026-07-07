import type { Activity, City, Category, Locale, Season, CategorySlug } from '@/types';

// ─── Static JSON imports ──────────────────────────────────────────────────────
// These are bundled at build time for fully static generation.

import citiesData from '@/data/cities.json';
import categoriesData from '@/data/categories.json';

// ─── Cities ───────────────────────────────────────────────────────────────────

export function getAllCities(): City[] {
  return citiesData as City[];
}

export function getFeaturedCities(): City[] {
  return (citiesData as City[]).filter((c) => c.featured);
}

export function getCityBySlug(slug: string): City | undefined {
  return (citiesData as City[]).find((c) => c.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return (citiesData as City[]).map((c) => c.slug);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function getAllCategories(): Category[] {
  return categoriesData as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return (categoriesData as Category[]).find((c) => c.slug === slug);
}

export function getAllCategorySlugs(): CategorySlug[] {
  return (categoriesData as Category[]).map((c) => c.slug as CategorySlug);
}

// ─── Activities ───────────────────────────────────────────────────────────────

/**
 * Load activities for a given city slug.
 * Falls back to an empty array if the city file doesn't exist yet.
 */
export async function getActivitiesByCity(citySlug: string): Promise<Activity[]> {
  try {
    const data = await import(`@/data/activities/${citySlug}.json`);
    return data.default as Activity[];
  } catch {
    return [];
  }
}

export async function getActivitiesByCityAndCategory(
  citySlug: string,
  categorySlug: string,
): Promise<Activity[]> {
  const all = await getActivitiesByCity(citySlug);
  return all.filter((a) => a.category.includes(categorySlug as CategorySlug));
}

export async function getActivitiesBySeason(
  citySlug: string,
  season: Season,
): Promise<Activity[]> {
  const all = await getActivitiesByCity(citySlug);
  return all.filter(
    (a) =>
      a.season.includes(season) || a.season.includes('year-round'),
  );
}

export async function getActivityById(
  citySlug: string,
  activityId: string,
): Promise<Activity | undefined> {
  const all = await getActivitiesByCity(citySlug);
  return all.find((a) => a.id === activityId);
}

// ─── Localisation helpers ─────────────────────────────────────────────────────

export function getLocalizedCityName(city: City, locale: Locale): string {
  return locale === 'fr' ? city.name_fr : city.name_en;
}

export function getLocalizedCategoryName(
  category: Category,
  locale: Locale,
): string {
  return locale === 'fr' ? category.name_fr : category.name_en;
}

export function getLocalizedActivityName(
  activity: Activity,
  locale: Locale,
): string {
  return locale === 'fr' ? activity.name_fr : activity.name_en;
}

export function getLocalizedActivityDescription(
  activity: Activity,
  locale: Locale,
): string {
  return locale === 'fr'
    ? activity.description_fr
    : activity.description_en;
}

// ─── Static params generation ─────────────────────────────────────────────────

export const LOCALES = ['en', 'fr'] as const;
export const SEASONS: Season[] = ['winter', 'spring', 'summer', 'fall'];

/**
 * Generate all locale × city combos for generateStaticParams()
 */
export function getCityStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllCitySlugs().map((city) => ({ locale, city })),
  );
}

/**
 * Generate all locale × city × category combos for generateStaticParams()
 */
export function getCityAndCategoryStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllCitySlugs().flatMap((city) =>
      getAllCategorySlugs().map((category) => ({ locale, city, category })),
    ),
  );
}

/**
 * Generate all locale × seasonal slugs for generateStaticParams().
 * Slug format: "{season}-{city}" e.g. "winter-montreal"
 */
export function getSeasonalStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllCitySlugs().flatMap((city) =>
      SEASONS.map((season) => ({ locale, slug: `${season}-${city}` })),
    ),
  );
}

/**
 * Parse a seasonal slug back into season + city.
 * Supports slugs like "winter-montreal" or "spring-kitchener-waterloo".
 */
export function parseSeasonalSlug(
  slug: string,
): { season: Season; citySlug: string } | null {
  for (const season of SEASONS) {
    if (slug.startsWith(`${season}-`)) {
      const citySlug = slug.slice(season.length + 1);
      return { season, citySlug };
    }
  }
  return null;
}
