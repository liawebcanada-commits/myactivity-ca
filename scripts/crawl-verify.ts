#!/usr/bin/env node
/**
 * scripts/crawl-verify.ts
 *
 * Full site crawl verification for MyActivity.ca.
 *
 * Generates every expected URL from the data files, fetches each one,
 * and validates:
 *   1. HTTP status is 200 (no 404s or 5xx)
 *   2. <link rel="canonical"> is present
 *   3. Canonical href matches the expected canonical URL
 *   4. Hreflang alternates (en-CA + fr-CA) are present
 *   5. Page has an <h1> element
 *
 * Output:
 *   - Live progress to stdout
 *   - Full markdown report to docs/crawl-report-{date}.md
 *
 * Usage:
 *   CRAWL_BASE=https://myactivity-ca.vercel.app npx tsx scripts/crawl-verify.ts
 *   (defaults to https://myactivity-ca.vercel.app if not set)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Config ───────────────────────────────────────────────────────────────────

const CRAWL_BASE =
  process.env.CRAWL_BASE ?? 'https://myactivity-ca.vercel.app';
const CANONICAL_BASE =
  process.env.CANONICAL_BASE ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://myactivity.ca';
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '6', 10);
const TIMEOUT_MS = 15_000;

const dataDir = path.join(process.cwd(), 'data');
const docsDir = path.join(process.cwd(), 'docs');

// ─── Data loading ──────────────────────────────────────────────────────────────

type City = { slug: string; name_en: string; name_fr: string };
type Category = { slug: string; name_en: string };

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as T;
}

const cities = loadJson<City[]>('cities.json');
const categories = loadJson<Category[]>('categories.json');
const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const;
const LOCALES = ['en', 'fr'] as const;

// ─── URL generation ────────────────────────────────────────────────────────────

interface ExpectedPage {
  crawlUrl: string;       // URL to fetch (CRAWL_BASE)
  canonicalUrl: string;   // Expected canonical in <head> (CANONICAL_BASE)
  enAlternate: string;    // Expected en-CA hreflang href
  frAlternate: string;    // Expected fr-CA hreflang href
  type: string;
  locale: string;
  label: string;
}

function cityPath(locale: string, slug: string): string {
  return locale === 'fr' ? `/${locale}/activites/${slug}` : `/${locale}/activities/${slug}`;
}

function categoryPath(locale: string, city: string, cat: string): string {
  return locale === 'fr'
    ? `/${locale}/activites/${city}/${cat}`
    : `/${locale}/activities/${city}/${cat}`;
}

function seasonalPath(locale: string, season: string, city: string): string {
  return locale === 'fr'
    ? `/${locale}/saison/${season}-${city}`
    : `/${locale}/seasonal/${season}-${city}`;
}

function buildPages(): ExpectedPage[] {
  const pages: ExpectedPage[] = [];

  // Homepages
  for (const locale of LOCALES) {
    const p = `/${locale}`;
    pages.push({
      crawlUrl: `${CRAWL_BASE}${p}`,
      canonicalUrl: `${CANONICAL_BASE}${p}`,
      enAlternate: `${CANONICAL_BASE}/en`,
      frAlternate: `${CANONICAL_BASE}/fr`,
      type: 'homepage',
      locale,
      label: `Homepage (${locale})`,
    });
  }

  for (const city of cities) {
    // City hubs
    for (const locale of LOCALES) {
      const enPath = `/en/activities/${city.slug}`;
      const frPath = `/fr/activites/${city.slug}`;
      const p = locale === 'fr' ? frPath : enPath;
      pages.push({
        crawlUrl: `${CRAWL_BASE}${p}`,
        canonicalUrl: `${CANONICAL_BASE}${p}`,
        enAlternate: `${CANONICAL_BASE}${enPath}`,
        frAlternate: `${CANONICAL_BASE}${frPath}`,
        type: 'city-hub',
        locale,
        label: `${city.name_en} hub (${locale})`,
      });
    }

    // City + category pages
    for (const cat of categories) {
      for (const locale of LOCALES) {
        const enPath = `/en/activities/${city.slug}/${cat.slug}`;
        const frPath = `/fr/activites/${city.slug}/${cat.slug}`;
        const p = locale === 'fr' ? frPath : enPath;
        pages.push({
          crawlUrl: `${CRAWL_BASE}${p}`,
          canonicalUrl: `${CANONICAL_BASE}${p}`,
          enAlternate: `${CANONICAL_BASE}${enPath}`,
          frAlternate: `${CANONICAL_BASE}${frPath}`,
          type: 'category-page',
          locale,
          label: `${city.name_en} / ${cat.name_en} (${locale})`,
        });
      }
    }

    // Seasonal hubs
    for (const season of SEASONS) {
      for (const locale of LOCALES) {
        const enPath = `/en/seasonal/${season}-${city.slug}`;
        const frPath = `/fr/saison/${season}-${city.slug}`;
        const p = locale === 'fr' ? frPath : enPath;
        pages.push({
          crawlUrl: `${CRAWL_BASE}${p}`,
          canonicalUrl: `${CANONICAL_BASE}${p}`,
          enAlternate: `${CANONICAL_BASE}${enPath}`,
          frAlternate: `${CANONICAL_BASE}${frPath}`,
          type: 'seasonal-hub',
          locale,
          label: `${city.name_en} ${season} (${locale})`,
        });
      }
    }
  }

  return pages;
}

// ─── HTTP fetch ────────────────────────────────────────────────────────────────

interface FetchResult {
  status: number;
  html: string;
  durationMs: number;
  error?: string;
}

async function fetchPage(url: string): Promise<FetchResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MyActivityCa-CrawlVerify/1.0' },
    });
    clearTimeout(timer);
    const html = await res.text();
    return { status: res.status, html, durationMs: Date.now() - start };
  } catch (err: unknown) {
    return {
      status: 0,
      html: '',
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── HTML parsing ──────────────────────────────────────────────────────────────

function extractMeta(html: string) {
  // Next.js renders hrefLang (camelCase) — use /i flag for both cases
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? null;
  const hreflangEn = html.match(/<link[^>]+hreflang="en-CA"[^>]+href="([^"]+)"/i)?.[1] ?? null;
  const hreflangFr = html.match(/<link[^>]+hreflang="fr-CA"[^>]+href="([^"]+)"/i)?.[1] ?? null;
  const xDefault   = html.match(/<link[^>]+hreflang="x-default"[^>]+href="([^"]+)"/i)?.[1] ?? null;
  const h1 = /<h1[\s>]/i.test(html);
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
  return { canonical, hreflangEn, hreflangFr, xDefault, h1, title };
}

// ─── Result type ──────────────────────────────────────────────────────────────

interface PageResult extends ExpectedPage, FetchResult {
  canonical: string | null;
  hreflangEn: string | null;
  hreflangFr: string | null;
  xDefault: string | null;
  h1: boolean;
  title: string | null;
  errors: string[];
  ok: boolean;
}

function validate(page: ExpectedPage, fetch: FetchResult): PageResult {
  const meta = extractMeta(fetch.html);
  const errors: string[] = [];

  if (fetch.error) {
    errors.push(`Network error: ${fetch.error}`);
  } else if (fetch.status !== 200) {
    errors.push(`HTTP ${fetch.status}`);
  }

  if (!meta.canonical) {
    errors.push('Missing <link rel="canonical">');
  } else if (meta.canonical !== page.canonicalUrl) {
    errors.push(
      `Canonical mismatch: got "${meta.canonical}" expected "${page.canonicalUrl}"`,
    );
  }

  if (!meta.hreflangEn) {
    errors.push('Missing hreflang="en-CA"');
  } else if (meta.hreflangEn !== page.enAlternate) {
    errors.push(
      `en-CA hreflang mismatch: got "${meta.hreflangEn}" expected "${page.enAlternate}"`,
    );
  }

  if (!meta.hreflangFr) {
    errors.push('Missing hreflang="fr-CA"');
  } else if (meta.hreflangFr !== page.frAlternate) {
    errors.push(
      `fr-CA hreflang mismatch: got "${meta.hreflangFr}" expected "${page.frAlternate}"`,
    );
  }

  if (!meta.xDefault) {
    errors.push('Missing hreflang="x-default"');
  }

  if (!meta.h1 && fetch.status === 200) {
    errors.push('No <h1> found in page');
  }

  return {
    ...page,
    ...fetch,
    canonical: meta.canonical,
    hreflangEn: meta.hreflangEn,
    hreflangFr: meta.hreflangFr,
    xDefault: meta.xDefault,
    h1: meta.h1,
    title: meta.title,
    errors,
    ok: errors.length === 0,
  };
}

// ─── Concurrency limiter ──────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onResult: (result: T, index: number, total: number) => void,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      const result = await tasks[index]();
      results[index] = result;
      completed++;
      onResult(result, completed, tasks.length);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pages = buildPages();
  const total = pages.length;

  console.log(`\n🕷️  MyActivity.ca — Full Site Crawl Verification`);
  console.log(`   Crawling: ${CRAWL_BASE}`);
  console.log(`   Expected canonical base: ${CANONICAL_BASE}`);
  console.log(`   Pages to check: ${total} (concurrency: ${CONCURRENCY})\n`);

  // Type counts
  const typeCounts = pages.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`   ${type}: ${count}`);
  }
  console.log();

  const startTime = Date.now();
  let passCount = 0;
  let failCount = 0;

  // ANSI colour helpers
  const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
  const red   = (s: string) => `\x1b[31m${s}\x1b[0m`;
  const dim   = (s: string) => `\x1b[2m${s}\x1b[0m`;

  const tasks = pages.map((page) => async () => {
    const fetchResult = await fetchPage(page.crawlUrl);
    return validate(page, fetchResult);
  });

  const results = await runWithConcurrency(
    tasks,
    CONCURRENCY,
    (result: PageResult, index: number, total: number) => {
      const pct = Math.round((index / total) * 100);
      if (result.ok) {
        passCount++;
        process.stdout.write(
          `\r  ${green('✓')} ${index}/${total} (${pct}%)  ${dim(result.label.slice(0, 60))}        `,
        );
      } else {
        failCount++;
        process.stdout.write('\n');
        console.log(
          `  ${red('✗')} [${result.status}] ${result.crawlUrl}`,
        );
        for (const err of result.errors) {
          console.log(`      ${red('→')} ${err}`);
        }
      }
    },
  );

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  process.stdout.write('\n\n');

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log(`──────────────────────────────────────────────────────`);
  console.log(`  Total pages: ${total}`);
  console.log(`  ${green(`✓ Passed: ${passCount}`)}`);
  if (failCount > 0) {
    console.log(`  ${red(`✗ Failed: ${failCount}`)}`);
  } else {
    console.log(`  ✗ Failed: 0`);
  }
  console.log(`  Duration: ${durationSec}s`);
  console.log(`──────────────────────────────────────────────────────\n`);

  // ─── Markdown report ──────────────────────────────────────────────────────

  const failures = results.filter((r) => !r.ok);
  const slowPages = results
    .filter((r) => r.ok && r.durationMs > 2000)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);

  const dateStr = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# MyActivity.ca — Crawl Verification Report`,
    ``,
    `**Date:** ${dateStr}  `,
    `**Crawl target:** ${CRAWL_BASE}  `,
    `**Canonical base:** ${CANONICAL_BASE}  `,
    `**Duration:** ${durationSec}s  `,
    ``,
    `---`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total pages | ${total} |`,
    `| Passed | ${passCount} |`,
    `| Failed | ${failCount} |`,
    `| Pass rate | ${((passCount / total) * 100).toFixed(1)}% |`,
    ``,
    `### Pages by type`,
    ``,
    `| Type | Count |`,
    `|------|-------|`,
    ...Object.entries(typeCounts).map(([t, c]) => `| ${t} | ${c} |`),
    ``,
    `---`,
    ``,
  ];

  if (failures.length === 0) {
    lines.push(`## ✅ All pages passed`);
    lines.push(``, `No 404s, no canonical errors, no missing hreflang tags.`);
  } else {
    lines.push(`## ❌ Failures (${failures.length})`);
    lines.push(``);
    for (const f of failures) {
      lines.push(`### ${f.label}`);
      lines.push(`- **URL:** ${f.crawlUrl}`);
      lines.push(`- **Status:** ${f.status}`);
      if (f.canonical) lines.push(`- **Canonical found:** ${f.canonical}`);
      lines.push(`- **Errors:**`);
      for (const e of f.errors) {
        lines.push(`  - ${e}`);
      }
      lines.push(``);
    }
  }

  if (slowPages.length > 0) {
    lines.push(`---`);
    lines.push(``);
    lines.push(`## ⚠️ Slow pages (> 2s, top 10)`);
    lines.push(``);
    lines.push(`| Page | Duration |`);
    lines.push(`|------|----------|`);
    for (const p of slowPages) {
      lines.push(`| ${p.label} | ${(p.durationMs / 1000).toFixed(2)}s |`);
    }
  }

  lines.push(``, `---`, ``, `*Generated by \`scripts/crawl-verify.ts\`*`);

  const report = lines.join('\n');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const reportPath = path.join(docsDir, `crawl-report-${dateStr}.md`);
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`📄  Full report: ${reportPath}\n`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
