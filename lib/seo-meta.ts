/**
 * Centralized SEO meta generator for MyActivity.ca
 *
 * Formula rules from Section 9.2 of the spec:
 *  - Title: "{Category/Activity} in {City} | MyActivity.ca"  (EN)
 *           "{Catégorie} à {Ville} | MyActivity.ca"           (FR)
 *           Target: 50-60 characters. City always present.
 *  - Meta description: 140-160 chars, city + category + concrete differentiator
 *    pulled from the page's own activity data.
 *
 * All functions return plain strings (not JSX) for use in `generateMetadata`.
 */

import type { City, Category, Activity, Locale } from '@/types';
import { getLocalizedCityName, getLocalizedCategoryName } from '@/lib/data';

const SITE_NAME = 'MyActivity.ca';

// ─── Title generators ─────────────────────────────────────────────────────────

/** Homepage title */
export function homeTitle(locale: Locale): string {
  return locale === 'fr'
    ? `Activités et sorties au Canada | ${SITE_NAME}`
    : `Things To Do in Canada | ${SITE_NAME}`;
}

/** City hub: "Things To Do in Montreal | MyActivity.ca" */
export function cityTitle(city: City, locale: Locale): string {
  const cityName = getLocalizedCityName(city, locale);
  return locale === 'fr'
    ? `Quoi faire à ${cityName} | ${SITE_NAME}`
    : `Things To Do in ${cityName} | ${SITE_NAME}`;
}

/** Category × city: "Indoor Activities in Toronto | MyActivity.ca" */
export function categoryTitle(
  category: Category,
  city: City,
  locale: Locale,
): string {
  const cityName = getLocalizedCityName(city, locale);
  const catName = getLocalizedCategoryName(category, locale);
  return locale === 'fr'
    ? `${catName} à ${cityName} | ${SITE_NAME}`
    : `${catName} in ${cityName} | ${SITE_NAME}`;
}

/** Seasonal hub: "Winter Activities in Ottawa | MyActivity.ca" */
export function seasonalTitle(
  seasonLabel: string,
  city: City,
  locale: Locale,
): string {
  const cityName = getLocalizedCityName(city, locale);
  return locale === 'fr'
    ? `Activités d'${seasonLabel} à ${cityName} | ${SITE_NAME}`
    : `${seasonLabel} Activities in ${cityName} | ${SITE_NAME}`;
}

// ─── Meta description generators ─────────────────────────────────────────────

/** Homepage description */
export function homeDescription(locale: Locale): string {
  return locale === 'fr'
    ? `Découvrez les meilleures activités, attraits et événements partout au Canada. Trouvez quoi faire à Montréal, Toronto, Vancouver, Calgary et plus de 12 villes — en toute saison.`
    : `Discover the best activities, attractions, and events across Canada. Find things to do in Toronto, Montreal, Vancouver, Calgary, and 12+ cities — every season.`;
}

/**
 * City hub description — pulls a concrete differentiator from activities.
 * Format: "Discover the best things to do in {city}. {Count} activities from
 *          free parks to world-class museums — updated for {year}."
 */
export function cityDescription(
  city: City,
  activities: Activity[],
  locale: Locale,
): string {
  const cityName = getLocalizedCityName(city, locale);
  const count = activities.length;
  const freeCount = activities.filter((a) => a.price_range === 'free').length;
  const year = new Date().getFullYear();

  if (locale === 'fr') {
    const freeNote =
      freeCount > 0 ? `, dont ${freeCount} gratuites` : '';
    return `Découvrez les meilleures choses à faire à ${cityName}${freeNote}. ${count} activités sélectionnées : plein air, musées, festivals et plus — mis à jour pour ${year}.`;
  }
  const freeNote = freeCount > 0 ? `, ${freeCount} free` : '';
  return `Discover the best things to do in ${cityName}${freeNote}. ${count} curated activities: outdoor, museums, festivals, and more — updated for ${year}.`;
}

/**
 * Category × city description — includes count + a sample activity name.
 * Format: "The best {N} {category} in {city} — {sample activity name} and more."
 */
export function categoryDescription(
  category: Category,
  city: City,
  activities: Activity[],
  locale: Locale,
): string {
  const cityName = getLocalizedCityName(city, locale);
  const catName = getLocalizedCategoryName(category, locale);
  const count = activities.length;
  const sample =
    activities[0]
      ? locale === 'fr'
        ? activities[0].name_fr
        : activities[0].name_en
      : '';

  if (locale === 'fr') {
    const sampleNote = sample ? ` comme ${sample}` : '';
    return `Les meilleures ${catName} à ${cityName}${sampleNote}. ${count} activités sélectionnées pour les résidents et les visiteurs — guide local mis à jour.`;
  }
  const sampleNote = sample ? ` including ${sample}` : '';
  return `The best ${catName} in ${cityName}${sampleNote}. ${count} curated activities for locals and visitors — updated local guide.`;
}

/** Seasonal description */
export function seasonalDescription(
  seasonLabel: string,
  city: City,
  activities: Activity[],
  locale: Locale,
): string {
  const cityName = getLocalizedCityName(city, locale);
  const count = activities.length;

  if (locale === 'fr') {
    return `Les meilleures activités d'${seasonLabel} à ${cityName}. ${count} idées de sorties sélectionnées — parfait pour les résidents et les visiteurs.`;
  }
  return `The best ${seasonLabel} activities in ${cityName}. ${count} handpicked ideas for locals and visitors alike.`;
}
