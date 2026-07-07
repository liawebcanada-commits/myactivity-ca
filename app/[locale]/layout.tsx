import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/middleware';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ConsentBanner from '@/components/ConsentBanner';
import { generateWebSiteSchema } from '@/lib/schema';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ─── Root metadata (overridden per-page) ─────────────────────────────────────

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: '%s | MyActivity.ca',
      default: t('homeTitle'),
    },
    description: t('homeDescription'),
    // Root-level hreflang — individual pages override canonical/languages
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        'en-CA': `${SITE_URL}/en`,
        'fr-CA': `${SITE_URL}/fr`,
        'x-default': `${SITE_URL}/en`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const messages = await getMessages();
  const webSiteSchema = generateWebSiteSchema(locale);

  return (
    <html lang={locale === 'fr' ? 'fr-CA' : 'en-CA'} className={inter.variable}>
      <head>
        {/* WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
