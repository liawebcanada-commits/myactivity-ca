import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/types';
import { getFeaturedCities, getAllCategories } from '@/lib/data';
import { buildPageMetadata } from '@/lib/metadata';

interface Props {
  params: { locale: Locale };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildPageMetadata({
    title: t('homeTitle'),
    description: t('homeDescription'),
    locale,
    path: '',
  });
}

export default async function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  const featuredCities = getFeaturedCities();
  const categories = getAllCategories();

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-50 to-white py-16 sm:py-24">
        <div className="container-page text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#cities"
              className="rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
            >
              {t('exploreCities')}
            </a>
            <a
              href="#categories"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              {t('exploreCategories')}
            </a>
          </div>
        </div>
      </section>

      {/* ─── Featured Cities ───────────────────────────────────────────────── */}
      <section id="cities" className="section">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('exploreCities')}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCities.map((city) => {
              const name = locale === 'fr' ? city.name_fr : city.name_en;
              return (
                <Link
                  key={city.slug}
                  href={`/${locale}/activities/${city.slug}`}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  {city.image_url && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={city.image_url}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <p className="text-xl font-bold">{name}</p>
                    <p className="text-sm opacity-80">{city.province}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Categories ────────────────────────────────────────────────────── */}
      <section id="categories" className="section bg-gray-50">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('exploreCategories')}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const name = locale === 'fr' ? cat.name_fr : cat.name_en;
              return (
                <Link
                  key={cat.slug}
                  href={`/${locale}/activities/toronto/${cat.slug}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {cat.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
