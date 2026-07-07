import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { cityPath } from '@/lib/urls';
import type { Locale } from '@/types';

export default function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-brand-red">
              MyActivity<span className="text-gray-900">.ca</span>
            </p>
            <p className="mt-2 text-sm text-gray-600">{t('description')}</p>
            <p className="mt-3 text-sm text-gray-400">{t('madeIn')}</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t('quickLinks')}
            </p>
            <ul className="mt-4 space-y-2">
              {[
                { href: `/${locale}`, label: tn('home') },
              { href: cityPath(locale as Locale, 'toronto'), label: 'Toronto' },
                { href: cityPath(locale as Locale, 'montreal'), label: 'Montréal' },
                { href: cityPath(locale as Locale, 'vancouver'), label: 'Vancouver' },
                { href: `/${locale}/about`, label: tn('about') },
                { href: `/${locale}/contact`, label: tn('contact') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-brand-red hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">
              {t('legalLinks')}
            </p>
            <ul className="mt-4 space-y-2">
              {[
                { href: `/${locale}/privacy`, label: tn('privacy') },
                { href: `/${locale}/contact`, label: tn('contact') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-brand-red hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  );
}
