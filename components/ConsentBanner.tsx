'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const CONSENT_KEY = 'myactivity_consent';

export type ConsentValue = 'accepted' | 'declined' | null;

/**
 * Read consent from localStorage — safe to call on client only.
 */
function getStoredConsent(): ConsentValue {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem(CONSENT_KEY) as ConsentValue) ?? null;
}

/**
 * Fire GA4 and AdSense only after explicit opt-in.
 * Inject the script tags dynamically so they are never loaded before consent.
 */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[];
  }
}

function activateTracking() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

  if (GA_ID && !document.getElementById('ga4-script')) {
    const s = document.createElement('script');
    s.id = 'ga4-script';
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    s.async = true;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: unknown[]) => { window.dataLayer.push(args); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  if (ADSENSE_ID && !document.getElementById('adsense-script')) {
    const s = document.createElement('script');
    s.id = 'adsense-script';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`;
    s.async = true;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }
}

export default function ConsentBanner() {
  const t = useTranslations('consent');
  const locale = useLocale();
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (stored === null) setVisible(true);
    if (stored === 'accepted') activateTracking();
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    setVisible(false);
    activateTracking();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setConsent('declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Copy */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{t('title')}</p>
          <p className="mt-1 text-sm text-gray-600">
            {t('description')}{' '}
            <Link
              href={`/${locale}/privacy`}
              className="underline hover:text-brand-red"
            >
              {t('privacyPolicy')}
            </Link>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleDecline}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t('declineAll')}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Utility for other components (e.g. AdUnit) ───────────────────────────────

export function hasConsent(): boolean {
  return getStoredConsent() === 'accepted';
}
