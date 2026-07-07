import type { Activity, City, Category, Locale } from '@/types';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';

// ─── BreadcrumbList ───────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── TouristAttraction ────────────────────────────────────────────────────────

export function generateTouristAttractionSchema(
  activity: Activity,
  locale: Locale,
) {
  const name =
    locale === 'fr' ? activity.name_fr : activity.name_en;
  const description =
    locale === 'fr'
      ? activity.description_fr
      : activity.description_en;

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    description,
    image: activity.image_url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: activity.address,
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: activity.lat,
      longitude: activity.lng,
    },
    ...(activity.affiliate_link && activity.affiliate_link !== '#AFFILIATE_LINK'
      ? { url: activity.affiliate_link }
      : {}),
    isAccessibleForFree: activity.price_range === 'free',
    touristType:
      activity.kid_friendly
        ? ['Family', 'Children']
        : ['Adults'],
  };
}

// ─── Event schema ─────────────────────────────────────────────────────────────

export function generateEventSchema(activity: Activity, locale: Locale) {
  if (!activity.event_start_date) return null;

  const name =
    locale === 'fr' ? activity.name_fr : activity.name_en;
  const description =
    locale === 'fr'
      ? activity.description_fr
      : activity.description_en;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    image: activity.image_url,
    startDate: activity.event_start_date,
    ...(activity.event_end_date ? { endDate: activity.event_end_date } : {}),
    location: {
      '@type': 'Place',
      name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: activity.address,
        addressCountry: 'CA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: activity.lat,
        longitude: activity.lng,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: name,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: activity.price_range === 'free',
    ...(activity.event_url ? { url: activity.event_url } : {}),
  };
}

// ─── CollectionPage + ItemList ────────────────────────────────────────────────

export function generateCollectionPageSchema(params: {
  name: string;
  description: string;
  url: string;
  activities: Activity[];
  locale: Locale;
}) {
  const { name, description, url, activities, locale } = params;

  const items = activities.map((activity, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'TouristAttraction',
      name: locale === 'fr' ? activity.name_fr : activity.name_en,
      image: activity.image_url,
      address: {
        '@type': 'PostalAddress',
        streetAddress: activity.address,
        addressCountry: 'CA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: activity.lat,
        longitude: activity.lng,
      },
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: activities.length,
      itemListElement: items,
    },
  };
}

// ─── City hub page schema ─────────────────────────────────────────────────────

export function generateCityHubSchema(params: {
  city: City;
  activities: Activity[];
  locale: Locale;
}) {
  const { city, activities, locale } = params;
  const cityName = locale === 'fr' ? city.name_fr : city.name_en;
  const url = `${SITE_URL}/${locale}/activities/${city.slug}`;

  return generateCollectionPageSchema({
    name:
      locale === 'fr'
        ? `Quoi faire à ${cityName}`
        : `Things To Do in ${cityName}`,
    description:
      locale === 'fr'
        ? (city.description_fr ?? `Activités et attractions à ${cityName}`)
        : (city.description_en ?? `Activities and attractions in ${cityName}`),
    url,
    activities,
    locale,
  });
}

// ─── Category page schema ─────────────────────────────────────────────────────

export function generateCategoryPageSchema(params: {
  city: City;
  category: Category;
  activities: Activity[];
  locale: Locale;
}) {
  const { city, category, activities, locale } = params;
  const cityName = locale === 'fr' ? city.name_fr : city.name_en;
  const categoryName =
    locale === 'fr' ? category.name_fr : category.name_en;
  const url = `${SITE_URL}/${locale}/activities/${city.slug}/${category.slug}`;

  return generateCollectionPageSchema({
    name:
      locale === 'fr'
        ? `${categoryName} à ${cityName}`
        : `${categoryName} in ${cityName}`,
    description:
      locale === 'fr'
        ? category.description_fr
        : category.description_en,
    url,
    activities,
    locale,
  });
}

// ─── Webpage / website base schema ───────────────────────────────────────────

export function generateWebSiteSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MyActivity.ca',
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    description:
      locale === 'fr'
        ? 'Répertoire canadien bilingue des meilleures activités, attraits et événements.'
        : 'Bilingual Canadian directory of the best activities, attractions, and events.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/activities/{city}`,
      },
      'query-input': 'required name=city',
    },
  };
}
