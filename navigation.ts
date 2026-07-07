/**
 * Localized navigation utilities for MyActivity.ca.
 *
 * Exports a typed `Link`, `redirect`, `usePathname`, and `useRouter` that
 * automatically handle the locale-specific path segments defined in middleware.ts
 * (e.g. /fr/activites/ ↔ /en/activities/).
 *
 * Use these instead of the stock next/link and next/navigation equivalents
 * anywhere you need locale-aware href generation.
 */

import { createLocalizedPathnamesNavigation } from 'next-intl/navigation';
import { locales, pathnames } from './middleware';

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createLocalizedPathnamesNavigation({ locales, pathnames });
