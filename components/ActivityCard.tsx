'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Activity, Locale } from '@/types';
import {
  getLocalizedActivityName,
  getLocalizedActivityDescription,
} from '@/lib/data';

const CONSENT_KEY = 'myactivity_consent';

/** Fire GA4 affiliate_click event — gated on Law 25 consent. */
function trackAffiliateClick(activity: Activity) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(CONSENT_KEY) !== 'accepted') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof w.gtag !== 'function') return;

  w.gtag('event', 'affiliate_click', {
    event_category: 'monetization',
    network: activity.affiliate_network ?? 'unknown',
    activity_id: activity.id,
    city: activity.city,
    category: activity.category[0] ?? 'unknown',
  });
}

interface ActivityCardProps {
  activity: Activity;
  locale: Locale;
}

const NETWORK_LABELS: Record<string, string> = {
  getyourguide: 'GetYourGuide',
  viator: 'Viator',
  groupon: 'Groupon',
  ticketmaster: 'Ticketmaster',
};

const PRICE_COLOURS: Record<string, string> = {
  free: 'bg-green-100 text-green-800',
  $:   'bg-blue-100 text-blue-800',
  $$:  'bg-yellow-100 text-yellow-800',
  $$$: 'bg-brand-100 text-brand-700',
};

export default function ActivityCard({ activity, locale }: ActivityCardProps) {
  const t = useTranslations('activityCard');
  const tp = useTranslations('priceRange');

  const name = getLocalizedActivityName(activity, locale);
  const description = getLocalizedActivityDescription(activity, locale);
  const excerpt = description.split(' ').slice(0, 30).join(' ') + '…';
  const altText =
    locale === 'fr'
      ? (activity.image_alt_fr ?? name)
      : (activity.image_alt_en ?? name);

  const hasAffiliate =
    activity.affiliate_link && activity.affiliate_link !== '#AFFILIATE_LINK';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <Image
          src={activity.image_url}
          alt={altText}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              PRICE_COLOURS[activity.price_range] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {tp(activity.price_range)}
          </span>
          {activity.kid_friendly && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
              {t('kidFriendlyBadge')}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-semibold leading-snug text-gray-900 line-clamp-2">
          {name}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
          {excerpt}
        </p>

        {/* Address */}
        {activity.address && (
          <p className="text-xs text-gray-400">
            📍 {activity.address}
          </p>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        {hasAffiliate ? (
          <a
            href={activity.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            aria-label={`${t('checkAvailability')} — ${name}`}
            onClick={() => trackAffiliateClick(activity)}
          >
            {activity.affiliate_network
              ? t('bookVia', {
                  network: NETWORK_LABELS[activity.affiliate_network] ?? activity.affiliate_network,
                })
              : t('checkAvailability')}
          </a>
        ) : (
          <span className="text-sm text-gray-400 italic">{t('checkAvailability')}</span>
        )}

        {hasAffiliate && (
          <span className="text-xs text-gray-400" aria-label={t('affiliateDisclosure')}>
            *
          </span>
        )}
      </div>
    </article>
  );
}
