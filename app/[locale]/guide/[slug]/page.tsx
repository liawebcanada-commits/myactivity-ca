import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/types';
import { guideAlternates } from '@/lib/urls';
import Breadcrumbs from '@/components/Breadcrumbs';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Guide data loader ─────────────────────────────────────────────────────────────────────
// Uses fs.readFileSync (not dynamic import) so the bundler does not attempt
// to resolve `data/guides/*.json` at build time.
// TODO: Replace with CMS / MDX loader when editorial guides are ready.

function getGuide(slug: string) {
  const filePath = path.join(process.cwd(), 'data', 'guides', `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface Props {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
  setRequestLocale(locale);
  const guide = getGuide(slug);
  if (!guide) return {};

  const title = locale === 'fr' ? guide.title_fr : guide.title_en;
  const description = locale === 'fr' ? guide.excerpt_fr : guide.excerpt_en;

  return {
    title,
    description,
    alternates: guideAlternates(locale, slug),
    openGraph: {
      title,
      description,
      url: guideAlternates(locale, slug).canonical,
      siteName: 'MyActivity.ca',
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      type: 'article',
      ...(guide.image_url ? { images: [{ url: guide.image_url }] } : {}),
    },
  };
}

export default async function GuidePage({ params: { locale, slug } }: Props) {
  setRequestLocale(locale);
  const guide = getGuide(slug);
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
