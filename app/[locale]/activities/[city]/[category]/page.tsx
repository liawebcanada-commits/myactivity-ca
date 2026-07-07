import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, CategorySlug } from '@/types';
import {
  getCityBySlug,
  getCategoryBySlug,
  getAllCategories,
  getAllCities,
  getActivitiesByCityAndCategory,
  getCityAndCategoryStaticParams,
  getLocalizedCityName,
  getLocalizedCategoryName,
  SEASONS,
} from '@/lib/data';
import { generateCategoryPageSchema, generateEventSchema } from '@/lib/schema';
import { categoryAlternates, categoryPath, cityPath, seasonalPath } from '@/lib/urls';
import { categoryTitle, categoryDescription } from '@/lib/seo-meta';
import ActivityCard from '@/components/ActivityCard';
import CategoryFilter from '@/components/CategoryFilter';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdUnit from '@/components/AdUnit';

interface Props {
  params: { locale: Locale; city: string; category: string };
}

// ─── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getCityAndCategoryStaticParams();
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params: { locale, city: citySlug, category: categorySlug } }: Props): Promise<Metadata> {
  setRequestLocale(locale);
  const city = getCityBySlug(citySlug);
  const category = getCategoryBySlug(categorySlug);
  if (!city || !category) return {};

  const activities = await getActivitiesByCityAndCategory(citySlug, categorySlug);

  return {
    title: categoryTitle(category, city, locale),
    description: categoryDescription(category, city, activities, locale),
    alternates: categoryAlternates(locale, citySlug, categorySlug),
    openGraph: {
      title: categoryTitle(category, city, locale),
      description: categoryDescription(category, city, activities, locale),
      url: categoryAlternates(locale, citySlug, categorySlug).canonical,
      siteName: 'MyActivity.ca',
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      type: 'website',
      ...(city.image_url ? { images: [{ url: city.image_url }] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryCityPage({
  params: { locale, city: citySlug, category: categorySlug },
}: Props) {
  setRequestLocale(locale);
  const city = getCityBySlug(citySlug);
  const category = getCategoryBySlug(categorySlug);
  if (!city || !category) notFound();

  const t = await getTranslations({ locale, namespace: 'categoryPage' });
  const tb = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const ta = await getTranslations({ locale, namespace: 'affiliate' });

  const activities = await getActivitiesByCityAndCategory(citySlug, categorySlug);
  const allCategories = getAllCategories();
  const allCities = getAllCities();
  const cityName = getLocalizedCityName(city, locale);
  const categoryName = getLocalizedCategoryName(category, locale);

  // 3 nearest sibling cities (same category, different city) — for internal link mesh
  const siblingCities = allCities
    .filter((c) => c.slug !== citySlug)
    .slice(0, 3);

  // Seasonal hub for the first relevant season
  const firstSeason = SEASONS[0];

  // JSON-LD — CollectionPage + Event schemas for any dated events in festivals category
  const schema = generateCategoryPageSchema({ city, category, activities, locale });
  const eventSchemas = activities
    .filter((a) => a.event_start_date)
    .map((a) => generateEventSchema(a, locale))
    .filter(Boolean);

  // Locale-aware breadcrumb URLs
  const localeCityPath = locale === 'fr' ? `/${locale}/activites/${citySlug}` : `/${locale}/activities/${citySlug}`;
  const localeCatPath  = locale === 'fr' ? `/${locale}/activites/${citySlug}/${categorySlug}` : `/${locale}/activities/${citySlug}/${categorySlug}`;
  const breadcrumbs = [
    { name: tb('home'), url: `/${locale}` },
    { name: cityName, url: localeCityPath },
    { name: categoryName, url: localeCatPath },
  ];

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Event schemas for activities with dates (e.g. festivals-events category) */}
      {eventSchemas.map((eventSchema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      ))}

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-50 to-white py-10 sm:py-14">
        <div className="container-page">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">{category.icon}</span>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('title', { city: cityName, category: categoryName })}
            </h1>
          </div>
          <p className="mt-2 text-lg text-gray-600">
            {t('subtitle', { city: cityName, category: categoryName })}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {t('count', { count: activities.length })}
          </p>
        </div>
      </section>

      {/* ─── Category filter ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white py-4">
        <div className="container-page">
          <CategoryFilter
            categories={allCategories}
            activeSlug={categorySlug as CategorySlug}
            locale={locale}
            citySlug={citySlug}
          />
        </div>
      </div>

      {/* ─── Activities grid ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-page">
          <p className="mb-6 text-xs text-gray-400">{ta('disclosure')}</p>

          {activities.length > 0 ? (
            <>
              <div className="activity-grid">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    locale={locale}
                  />
                ))}
              </div>
              <AdUnit
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY ?? '0000000000'}
                className="mt-12"
              />
            </>
          ) : (
            <p className="text-gray-500">{t('count', { count: 0 })}</p>
          )}
        </div>
      </section>

      {/* ─── Internal links: parent city + 3 sibling cities same category ─── */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {locale === 'fr'
              ? `${categoryName} dans d'autres villes`
              : `${categoryName} in Other Cities`}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={cityPath(locale, citySlug)}
              className="rounded-full border border-brand-red bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-red"
            >
              {locale === 'fr' ? `Toutes les activités à ${cityName}` : `All activities in ${cityName}`}
            </Link>
            {siblingCities.map((sibling) => (
              <Link
                key={sibling.slug}
                href={categoryPath(locale, sibling.slug, categorySlug)}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-brand-red hover:text-brand-red"
              >
                {locale === 'fr' ? sibling.name_fr : sibling.name_en}
              </Link>
            ))}
          </div>

          {/* Link to seasonal hub */}
          <p className="mt-6 text-sm text-gray-600">
            {locale === 'fr' ? 'Voir aussi : ' : 'See also: '}
            <Link
              href={seasonalPath(locale, firstSeason, citySlug)}
              className="font-medium text-brand-red hover:underline"
            >
              {locale === 'fr'
                ? `Activités d'hiver à ${cityName}`
                : `Winter activities in ${cityName}`}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
