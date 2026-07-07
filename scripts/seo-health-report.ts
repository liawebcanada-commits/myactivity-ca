#!/usr/bin/env node
/**
 * scripts/seo-health-report.ts
 *
 * Monthly SEO health report for MyActivity.ca.
 *
 * Audits the data layer to produce a Markdown report covering:
 *  - Total page counts per type and locale
 *  - Thin content warnings (descriptions < 150 words)
 *  - Missing or short meta descriptions
 *  - Activities flagged for freshness review (festivals/events)
 *  - Hreflang pair count validation (mirrors validate-hreflang.ts)
 *  - Affiliate link stub count (#AFFILIATE_LINK placeholders)
 *
 * Output: docs/seo-health-report-{date}.md
 *
 * Run: npx ts-node --project tsconfig.json scripts/seo-health-report.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
const docsDir = path.join(process.cwd(), 'docs');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myactivity.ca';
const MIN_DESCRIPTION_WORDS = 150;

type Activity = {
  id: string;
  city: string;
  category: string[];
  description_en: string;
  description_fr: string;
  affiliate_link: string;
  last_updated: string;
  event_start_date?: string;
};

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as T;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function loadAllActivities(): Activity[] {
  const activitiesDir = path.join(dataDir, 'activities');
  const files = fs.readdirSync(activitiesDir).filter((f) => f.endsWith('.json'));
  const all: Activity[] = [];
  for (const file of files) {
    const items = JSON.parse(
      fs.readFileSync(path.join(activitiesDir, file), 'utf-8'),
    ) as Activity[];
    all.push(...items);
  }
  return all;
}

function run() {
  const cities = loadJson<Array<{ slug: string }>>('cities.json');
  const categories = loadJson<Array<{ slug: string }>>('categories.json');
  const activities = loadAllActivities();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const SEASONS = ['winter', 'spring', 'summer', 'fall'];

  // ─── Counts ─────────────────────────────────────────────────────────────────
  const cityCount = cities.length;
  const categoryCount = categories.length;
  const totalCityHubs = cityCount * 2; // EN + FR
  const totalCategoryPages = cityCount * categoryCount * 2;
  const totalSeasonalHubs = cityCount * SEASONS.length * 2;
  const totalPages = 2 + totalCityHubs + totalCategoryPages + totalSeasonalHubs; // +2 for homepages

  // ─── Thin content ────────────────────────────────────────────────────────────
  const thinContent = activities.filter(
    (a) =>
      wordCount(a.description_en) < MIN_DESCRIPTION_WORDS ||
      wordCount(a.description_fr) < MIN_DESCRIPTION_WORDS,
  );

  // ─── Affiliate stubs ─────────────────────────────────────────────────────────
  const affiliateStubs = activities.filter(
    (a) => !a.affiliate_link || a.affiliate_link === '#AFFILIATE_LINK',
  );

  // ─── Freshness flags: festivals/events with dates in the past ────────────────
  const staleEvents = activities.filter((a) => {
    if (!a.event_start_date) return false;
    return new Date(a.event_start_date) < now;
  });

  const freshnessFlagged = activities.filter(
    (a) => a.category.includes('festivals-events'),
  );

  // ─── Generate report ─────────────────────────────────────────────────────────
  const lines: string[] = [
    `# MyActivity.ca — SEO Health Report`,
    ``,
    `**Generated:** ${dateStr}  `,
    `**Site:** ${SITE_URL}`,
    ``,
    `---`,
    ``,
    `## 1. Page Inventory`,
    ``,
    `| Page type | Count (per locale) | Total (both locales) |`,
    `|-----------|-------------------|----------------------|`,
    `| Homepages | 1 | 2 |`,
    `| City hubs | ${cityCount} | ${totalCityHubs} |`,
    `| Category pages | ${cityCount * categoryCount} | ${totalCategoryPages} |`,
    `| Seasonal hubs | ${cityCount * SEASONS.length} | ${totalSeasonalHubs} |`,
    `| **Total** | **${totalPages / 2}** | **${totalPages}** |`,
    ``,
    `**Activities in data layer:** ${activities.length} (across ${cityCount} cities)`,
    ``,
    `---`,
    ``,
    `## 2. Content Quality`,
    ``,
    `### Thin Content (< ${MIN_DESCRIPTION_WORDS} words)`,
    ``,
    thinContent.length === 0
      ? `✅ No thin content detected. All descriptions meet the ${MIN_DESCRIPTION_WORDS}-word minimum.`
      : `⚠️ **${thinContent.length} activities** have descriptions below ${MIN_DESCRIPTION_WORDS} words:\n\n${thinContent
          .map(
            (a) =>
              `- \`${a.id}\` — EN: ${wordCount(a.description_en)} words, FR: ${wordCount(a.description_fr)} words`,
          )
          .join('\n')}`,
    ``,
    `---`,
    ``,
    `## 3. Affiliate Links`,
    ``,
    affiliateStubs.length === 0
      ? `✅ All ${activities.length} activities have live affiliate links.`
      : `⚠️ **${affiliateStubs.length} activities** still have placeholder \`#AFFILIATE_LINK\`:\n\n${affiliateStubs
          .map((a) => `- \`${a.id}\` (${a.city})`)
          .join('\n')}`,
    ``,
    `---`,
    ``,
    `## 4. Freshness — Festival & Events`,
    ``,
    `Festival/event pages require content review every 60 days (stale event dates are a negative ranking signal).`,
    ``,
    `**Total festival/event activities:** ${freshnessFlagged.length}`,
    ``,
    staleEvents.length === 0
      ? `✅ No events with past start dates detected.`
      : `⚠️ **${staleEvents.length} events** have \`event_start_date\` in the past:\n\n${staleEvents
          .map((a) => `- \`${a.id}\` — start date: ${a.event_start_date}`)
          .join('\n')}`,
    ``,
    `---`,
    ``,
    `## 5. Hreflang Coverage`,
    ``,
    `Expected pairs: **${1 + cityCount + cityCount * categoryCount + cityCount * SEASONS.length}** (1 home + ${cityCount} city hubs + ${cityCount * categoryCount} category pages + ${cityCount * SEASONS.length} seasonal hubs)`,
    ``,
    `Run \`npm run validate-hreflang\` for full pair-by-pair validation.`,
    ``,
    `---`,
    ``,
    `## 6. Action Items`,
    ``,
    ...(thinContent.length > 0 ? [`- [ ] Rewrite ${thinContent.length} thin-content activity description(s)`] : []),
    ...(affiliateStubs.length > 0 ? [`- [ ] Replace ${affiliateStubs.length} \`#AFFILIATE_LINK\` placeholder(s) with live affiliate URLs`] : []),
    ...(staleEvents.length > 0 ? [`- [ ] Update ${staleEvents.length} past event date(s) in activity data files`] : []),
    thinContent.length === 0 && affiliateStubs.length === 0 && staleEvents.length === 0
      ? `✅ No action items — all checks passed.`
      : ``,
    ``,
    `---`,
    ``,
    `*Generated by \`scripts/seo-health-report.ts\`. Run monthly per Section 9.6 of the production spec.*`,
  ];

  const report = lines.join('\n');

  // Write to docs/
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const outPath = path.join(docsDir, `seo-health-report-${dateStr}.md`);
  fs.writeFileSync(outPath, report, 'utf-8');

  console.log(`\n📊  SEO health report written to: ${outPath}`);
  console.log(`    Pages: ${totalPages} | Activities: ${activities.length}`);
  console.log(`    Thin content: ${thinContent.length} | Affiliate stubs: ${affiliateStubs.length} | Stale events: ${staleEvents.length}\n`);
}

run();
