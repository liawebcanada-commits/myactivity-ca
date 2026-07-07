'use client';

import { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
}

const CONSENT_KEY = 'myactivity_consent';

/**
 * AdSense responsive unit. Only renders after Law 25 consent is given.
 * Should only be placed on city hub and category pages — not stub pages.
 */
export default function AdUnit({ slot, format = 'auto', className = '' }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted') {
      setHasConsent(true);
    }

    // Listen for consent changes after initial render
    const handleStorageChange = () => {
      const newValue = localStorage.getItem(CONSENT_KEY);
      if (newValue === 'accepted') setHasConsent(true);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!hasConsent || !adRef.current || !ADSENSE_ID) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet — the ConsentBanner will inject the script
    }
  }, [hasConsent, ADSENSE_ID]);

  if (!hasConsent || !ADSENSE_ID) return null;

  return (
    <div className={`ad-unit overflow-hidden ${className}`} aria-hidden="true">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
