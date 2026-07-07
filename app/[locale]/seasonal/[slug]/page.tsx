import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/types';
import {
  getCityBySlug,
  getActivitiesBySeason,
  getSeasonalStaticParams,
  parseSeasonalSlug,
  getLocalizedCityName,
} from '@/lib/data';
import { generateCollectionPageSchema, generateEventSchema } from '@/lib/schema';
import { seasonalAlternates } from '@/lib/urls';
import { seasonalTitle, seasonalDescription } from '@/lib/seo-meta';
import ActivityCard from '@/components/ActivityCard';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Props {
  params: { locale: Locale; slug: string };
}

// ─── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getSeasonalStaticParams();
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
  const parsed = parseSeasonalSlug(slug);
  if (!parsed) return {};

  const city = getCityBySlug(parsed.citySlug);
  if (!city) return {};

  const t = await getTranslations({ locale, namespace: 'meta' });
  const ts = await getTranslations({ locale, namespace: 'seasons' });
  const cityName = getLocalizedCityName(city, locale);
  const seasonLabel = ts(parsed.season);

  const activities = await getActivitiesBySeason(parsed.citySlug, parsed.season);

  return {
    title: seasonalTitle(seasonLabel, city, locale),
    description: seasonalDescription(seasonLabel, city, activities, locale),
    alternates: seasonalAlternates(locale, parsed.season, parsed.citySlug),
    openGraph: {
      title: seasonalTitle(seasonLabel, city, locale),
      description: seasonalDescription(seasonLabel, city, activities, locale),
      url: seasonalAlternates(locale, parsed.season, parsed.citySlug).canonical,
      siteName: 'MyActivity.ca',
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      type: 'website',
      ...(city.image_url ? { images: [{ url: city.image_url }] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SeasonalHubPage({ params: { locale, slug } }: Props) {
  const parsed = parseSeasonalSlug(slug);
  if (!parsed) notFound();

  const city = getCityBySlug(parsed.citySlug);
  if (!city) notFound();

  const t = await getTranslations({ locale, namespace: 'seasonalPage' });
  const tb = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const ts = await getTranslations({ locale, namespace: 'seasons' });

  const activities = await getActivitiesBySeason(parsed.citySlug, parsed.season);
  const cityName = getLocalizedCityName(city, locale);
  const seasonLabel = ts(parsed.season);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';

  // JSON-LD — mix of CollectionPage + individual Event schemas for festivals
  const collectionSchema = generateCollectionPageSchema({
    name: locale === 'fr'
      ? `Activités d'${seasonLabel} à ${cityName}`
      : `${seasonLabel} Activities in ${cityName}`,
    description: locale === 'fr'
      ? `Les meilleures activités d'${seasonLabel} à ${cityName}, au Canada.`
      : `The best ${seasonLabel} activities in ${cityName}, Canada.`,
    url: `${SITE_URL}/${locale}/seasonal/${slug}`,
    activities,
    locale,
  });

  // Generate Event schemas for festival activities
  const eventSchemas = activities
    .filter((a) => a.event_start_date)
    .map((a) => generateEventSchema(a, locale))
    .filter(Boolean);

  const breadcrumbItems = [
    { name: tb('home'), url: `/${locale}` },
    { name: cityName, url: `/${locale}/activities/${parsed.citySlug}` },
    { name: `${seasonLabel} — ${cityName}`, url: `/${locale}/seasonal/${slug}` },
  ];

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      {eventSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-50 to-white py-10 sm:py-14">
        <div className="container-page">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('title', { city: cityName, season: seasonLabel })}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('subtitle', { city: cityName, season: seasonLabel })}
          </p>
        </div>
      </section>

      {/* ─── Activities ──────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-page">
          {activities.length > 0 ? (
            <div className="activity-grid">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              {t('subtitle', { city: cityName, season: seasonLabel })}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
