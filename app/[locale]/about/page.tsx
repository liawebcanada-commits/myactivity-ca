import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/types';
import { buildPageMetadata } from '@/lib/metadata';

interface Props {
  params: { locale: Locale };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  return buildPageMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: '/about',
  });
}

export default async function AboutPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t('heading')}</h1>
        <p className="mt-4 text-lg text-gray-600">{t('description')}</p>
        <p className="mt-4 text-gray-600">{t('mission')}</p>
      </div>
    </section>
  );
}
