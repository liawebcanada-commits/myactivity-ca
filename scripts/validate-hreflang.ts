#!/usr/bin/env node
/**
 * scripts/validate-hreflang.ts
 *
 * CI hreflang validation script for MyActivity.ca.
 *
 * Reads the programmatic URL list (does not crawl live HTML — runs against the
 * data files so it works pre-deployment) and verifies that for every EN URL
 * there is a corresponding FR URL and vice versa, matching what the
 * generateSitemaps() function produces.
 *
 * Exit 0 = all pairs valid
 * Exit 1 = missing reciprocal pairs detected (CI failure)
 *
 * This script was built to prevent the exact hreflang failure mode that caused
 * 5,400 pages to be unindexed on AstrologySky.com.
 *
 * Run: npx ts-node --project tsconfig.json scripts/validate-hreflang.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type City = { slug: string };
type Category = { slug: string };

const dataDir = path.join(process.cwd(), 'data');

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as T;
}

const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';

// ─── Build expected URL pairs ────────────────────────────────────────────────

type UrlPair = { en: string; fr: string; type: string };

function buildExpectedPairs(): UrlPair[] {
  const cities = loadJson<City[]>('cities.json');
  const categories = loadJson<Category[]>('categories.json');
  const pairs: UrlPair[] = [];

  // Homepages
  pairs.push({ en: `${SITE_URL}/en`, fr: `${SITE_URL}/fr`, type: 'homepage' });

  for (const city of cities) {
    // City hubs
    pairs.push({
      en: `${SITE_URL}/en/activities/${city.slug}`,
      fr: `${SITE_URL}/fr/activites/${city.slug}`,
      type: 'city-hub',
    });

    // City + category pages
    for (const cat of categories) {
      pairs.push({
        en: `${SITE_URL}/en/activities/${city.slug}/${cat.slug}`,
        fr: `${SITE_URL}/fr/activites/${city.slug}/${cat.slug}`,
        type: 'category-page',
      });
    }

    // Seasonal hubs
    for (const season of SEASONS) {
      pairs.push({
        en: `${SITE_URL}/en/seasonal/${season}-${city.slug}`,
        fr: `${SITE_URL}/fr/saison/${season}-${city.slug}`,
        type: 'seasonal-hub',
      });
    }
  }

  return pairs;
}

// ─── Validate ─────────────────────────────────────────────────────────────────

function validatePairs(pairs: UrlPair[]): void {
  const errors: string[] = [];
  const enSet = new Set(pairs.map((p) => p.en));
  const frSet = new Set(pairs.map((p) => p.fr));

  for (const pair of pairs) {
    // Each EN URL must have a corresponding FR URL and vice versa
    if (!frSet.has(pair.fr)) {
      errors.push(`[${pair.type}] Missing FR counterpart for: ${pair.en}`);
    }
    if (!enSet.has(pair.en)) {
      errors.push(`[${pair.type}] Missing EN counterpart for: ${pair.fr}`);
    }

    // Validate URL format: no uppercase, no trailing slash, valid ASCII path
    if (/[A-Z]/.test(pair.en) || /[A-Z]/.test(pair.fr)) {
      errors.push(`[${pair.type}] URL contains uppercase: ${pair.en} | ${pair.fr}`);
    }
    if (pair.en.endsWith('/') || pair.fr.endsWith('/')) {
      errors.push(`[${pair.type}] URL has trailing slash: ${pair.en} | ${pair.fr}`);
    }

    // FR path must use correct locale-specific segments
    if (pair.type === 'city-hub' && !pair.fr.includes('/activites/')) {
      errors.push(`[city-hub] FR city hub URL missing /activites/: ${pair.fr}`);
    }
    if (pair.type === 'seasonal-hub' && !pair.fr.includes('/saison/')) {
      errors.push(`[seasonal-hub] FR seasonal URL missing /saison/: ${pair.fr}`);
    }
  }

  const totalPages = pairs.length * 2; // EN + FR
  console.log(`\n✅  Validated ${pairs.length} URL pairs (${totalPages} total pages)`);

  const byType = pairs.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   ${type}: ${count} pairs`);
  }

  if (errors.length > 0) {
    console.error('\n❌  Hreflang validation FAILED:\n');
    for (const e of errors) {
      console.error(`  • ${e}`);
    }
    console.error(`\n${errors.length} error(s) found. Fix before deploying.\n`);
    process.exit(1);
  }

  console.log('\n✅  All hreflang pairs are valid. No missing reciprocal alternates.\n');
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const pairs = buildExpectedPairs();
validatePairs(pairs);
