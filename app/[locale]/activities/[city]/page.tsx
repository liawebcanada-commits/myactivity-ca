import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/types';
import {
  getCityBySlug,
  getAllCategories,
  getActivitiesByCity,
  getCityStaticParams,
  getLocalizedCityName,
  SEASONS,
} from '@/lib/data';
import { generateCityHubSchema } from '@/lib/schema';
import { cityAlternates, categoryPath, seasonalPath } from '@/lib/urls';
import { cityTitle, cityDescription } from '@/lib/seo-meta';
import ActivityCard from '@/components/ActivityCard';
import CategoryFilter from '@/components/CategoryFilter';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdUnit from '@/components/AdUnit';

interface Props {
  params: { locale: Locale; city: string };
}

// ─── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getCityStaticParams();
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params: { locale, city: citySlug } }: Props): Promise<Metadata> {
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  const activities = await getActivitiesByCity(citySlug);

  return {
    title: cityTitle(city, locale),
    description: cityDescription(city, activities, locale),
    alternates: cityAlternates(locale, citySlug),
    openGraph: {
      title: cityTitle(city, locale),
      description: cityDescription(city, activities, locale),
      url: cityAlternates(locale, citySlug).canonical,
      siteName: 'MyActivity.ca',
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      type: 'website',
      ...(city.image_url ? { images: [{ url: city.image_url }] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityHubPage({ params: { locale, city: citySlug } }: Props) {
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const t = await getTranslations({ locale, namespace: 'cityHub' });
  const tb = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const ta = await getTranslations({ locale, namespace: 'affiliate' });

  const activities = await getActivitiesByCity(citySlug);
  const categories = getAllCategories();
  const cityName = getLocalizedCityName(city, locale);

  // JSON-LD
  const cityHubSchema = generateCityHubSchema({ city, activities, locale });
  const cityHubUrl = categoryPath(locale, citySlug, '').replace(/\/$/, '') || `/${locale}`;
  const breadcrumbItems = [
    { name: tb('home'), url: `/${locale}` },
    { name: cityName, url: categoryPath(locale, citySlug, '').replace(/\/[^/]*$/, '') || `/${locale}/activities/${citySlug}` },
  ];
  // Use locale-aware city path for breadcrumbs
  const localeCityPath = locale === 'fr' ? `/${locale}/activites/${citySlug}` : `/${locale}/activities/${citySlug}`;
  const breadcrumbs = [
    { name: tb('home'), url: `/${locale}` },
    { name: cityName, url: localeCityPath },
  ];

  // Season labels for the internal linking section
  const seasonLabels: Record<string, string> = locale === 'fr'
    ? { winter: 'Hiver', spring: 'Printemps', summer: 'Été', fall: 'Automne' }
    : { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' };

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cityHubSchema) }}
      />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-50 to-white py-10 sm:py-14">
        <div className="container-page">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('title', { city: cityName })}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('subtitle', { city: cityName })}
          </p>
        </div>
      </section>

      {/* ─── Category filter ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white py-4">
        <div className="container-page">
          <CategoryFilter
            categories={categories}
            locale={locale}
            citySlug={citySlug}
          />
        </div>
      </div>

      {/* ─── Activities grid ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-page">
          {/* Affiliate disclosure */}
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

      {/* AdSense — only shown after consent */}
              <AdUnit
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CITY ?? '0000000000'}
                className="mt-12"
              />
            </>
          ) : (
            <p className="text-gray-500">{t('allActivities', { city: cityName })}</p>
          )}
        </div>
      </section>

      {/* ─── Internal link mesh: all 8 categories ────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('categories')}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={categoryPath(locale, citySlug, cat.slug)}
                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-sm font-medium text-gray-700 shadow-sm transition-shadow hover:shadow-md"
              >
                <span aria-hidden="true">{cat.icon}</span>
                <span>{locale === 'fr' ? cat.name_fr : cat.name_en}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Internal link mesh: 4 seasonal hubs ─────────────────────────── */}
      <section className="section">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-gray-900">{t('seasonal')}</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {SEASONS.map((season) => (
              <Link
                key={season}
                href={seasonalPath(locale, season, citySlug)}
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-red hover:text-brand-red"
              >
                {seasonLabels[season] ?? season}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
