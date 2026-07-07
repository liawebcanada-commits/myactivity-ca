'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { mirrorPath } from '@/lib/urls';
import type { Locale } from '@/types';

/**
 * Switches between /en/... and /fr/... paths.
 * Uses mirrorPath to correctly swap /en/activities/ ↔ /fr/activites/ etc.
 * Shows a single Canadian flag — locale switching is icon-based per convention.
 */
export default function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const targetLocale = currentLocale === 'en' ? 'fr' : 'en';
  const targetLabel = currentLocale === 'en' ? 'Français' : 'English';

  const handleSwitch = () => {
    // mirrorPath handles /activities/ ↔ /activites/ and /seasonal/ ↔ /saison/ swaps
    const newPath = mirrorPath(currentLocale as Locale, pathname);
    router.push(newPath);
  };

  return (
    <button
      onClick={handleSwitch}
      aria-label={`Switch to ${targetLabel}`}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
    >
      {/* Canadian flag emoji — only flag shown, per convention */}
      <span aria-hidden="true" className="text-base leading-none">🇨🇦</span>
      <span className="hidden sm:inline">{targetLabel}</span>
      <span className="sm:hidden">{targetLocale.toUpperCase()}</span>
    </button>
  );
}
