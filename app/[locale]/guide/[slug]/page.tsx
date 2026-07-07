import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/types';
import { buildPageMetadata } from '@/lib/metadata';
import Breadcrumbs from '@/components/Breadcrumbs';

// ─── Guide data loader ────────────────────────────────────────────────────────
// TODO: Replace with your CMS / MDX loader when editorial guides are ready.
// For now this returns null for any slug so the page 404s gracefully.

async function getGuide(slug: string, locale: Locale) {
  try {
    const data = await import(`@/data/guides/${slug}.json`);
    return data.default;
  } catch {
    return null;
  }
}

interface Props {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
  const guide = await getGuide(slug, locale);
  if (!guide) return {};

  const title = locale === 'fr' ? guide.title_fr : guide.title_en;
  const description = locale === 'fr' ? guide.excerpt_fr : guide.excerpt_en;

  return buildPageMetadata({
    title,
    description,
    locale,
    path: `/guide/${slug}`,
    imageUrl: guide.image_url,
  });
}

export default async function GuidePage({ params: { locale, slug } }: Props) {
  const guide = await getGuide(slug, locale);
  if (!guide) notFound();

  const tb = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const title = locale === 'fr' ? guide.title_fr : guide.title_en;
  const content = locale === 'fr' ? guide.content_fr : guide.content_en;

  const breadcrumbItems = [
    { name: tb('home'), url: `/${locale}` },
    { name: tb('guides'), url: `/${locale}/guide` },
    { name: title, url: `/${locale}/guide/${slug}` },
  ];

  return (
    <article className="section">
      <div className="container-page max-w-3xl">
        <Breadcrumbs items={breadcrumbItems} />

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>

        {guide.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guide.image_url}
            alt={title}
            className="mt-6 h-64 w-full rounded-2xl object-cover sm:h-80"
          />
        )}

        <div
          className="prose prose-lg mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </article>
  );
}
