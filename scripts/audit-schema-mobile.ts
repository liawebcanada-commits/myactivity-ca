#!/usr/bin/env node
/**
 * scripts/audit-schema-mobile.ts
 *
 * Final audit: JSON-LD schema + mobile readiness for a representative
 * 10-page sample covering all template types.
 *
 * Checks per page:
 *   MOBILE
 *   - <meta name="viewport"> present with width=device-width
 *   - No inline style with fixed pixel width (heuristic)
 *   - <html lang> attribute present
 *
 *   JSON-LD
 *   - At least one <script type="application/ld+json"> block present
 *   - Each block parses as valid JSON
 *   - Expected @type present for each page type
 *   - Required fields present (url, name, description, geo for TouristAttraction, etc.)
 *   - No empty required string fields
 *
 * Run:
 *   npx tsx scripts/audit-schema-mobile.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const CRAWL_BASE =
  process.env.CRAWL_BASE ?? 'https://myactivity-ca.vercel.app';
const docsDir = path.join(process.cwd(), 'docs');

// ─── Sample pages ─────────────────────────────────────────────────────────────

const SAMPLE = [
  {
    label: 'Homepage EN',
    path: '/en',
    expectedTypes: ['WebSite'],
    templateType: 'homepage',
  },
  {
    label: 'Homepage FR',
    path: '/fr',
    expectedTypes: ['WebSite'],
    templateType: 'homepage',
  },
  {
    label: 'City hub — Toronto (EN)',
    path: '/en/activities/toronto',
    expectedTypes: ['CollectionPage', 'BreadcrumbList'],
    templateType: 'city-hub',
  },
  {
    label: 'City hub — Montréal (FR)',
    path: '/fr/activites/montreal',
    expectedTypes: ['CollectionPage', 'BreadcrumbList'],
    templateType: 'city-hub',
  },
  {
    label: 'Category — Toronto / outdoor (EN)',
    path: '/en/activities/toronto/outdoor',
    expectedTypes: ['CollectionPage', 'BreadcrumbList'],
    templateType: 'category-page',
  },
  {
    label: 'Category — Montréal / festivals-events (FR)',
    path: '/fr/activites/montreal/festivals-events',
    expectedTypes: ['CollectionPage', 'BreadcrumbList', 'Event'],
    templateType: 'category-page',
  },
  {
    label: 'Seasonal — winter-montreal (EN)',
    path: '/en/seasonal/winter-montreal',
    expectedTypes: ['CollectionPage', 'BreadcrumbList'],
    templateType: 'seasonal-hub',
  },
  {
    label: 'Seasonal — summer-toronto (FR)',
    path: '/fr/saison/summer-toronto',
    expectedTypes: ['CollectionPage', 'BreadcrumbList'],
    templateType: 'seasonal-hub',
  },
  {
    label: 'Privacy (EN)',
    path: '/en/privacy',
    expectedTypes: [],   // no JSON-LD required on utility pages
    templateType: 'static',
  },
  {
    label: 'About (FR)',
    path: '/fr/about',
    expectedTypes: [],
    templateType: 'static',
  },
];

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<{ status: number; html: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MyActivityCa-SchemaAudit/1.0' },
    });
    const html = await res.text();
    return { status: res.status, html };
  } catch (err: unknown) {
    return { status: 0, html: '' };
  }
}

// ─── JSON-LD extraction ───────────────────────────────────────────────────────

function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      blocks.push({ __parseError: true, raw: match[1].slice(0, 100) });
    }
  }
  return blocks;
}

function allTypes(blocks: unknown[]): string[] {
  const types: string[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (typeof obj['@type'] === 'string') types.push(obj['@type']);
    if (Array.isArray(obj['@type'])) types.push(...(obj['@type'] as string[]));
    for (const v of Object.values(obj)) {
      if (typeof v === 'object') walk(v);
    }
  }
  blocks.forEach(walk);
  return Array.from(new Set(types));
}

// ─── Schema field checks ──────────────────────────────────────────────────────

function validateSchema(blocks: unknown[]): string[] {
  const issues: string[] = [];

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if ((block as Record<string, unknown>).__parseError) {
      issues.push('JSON-LD parse error');
      continue;
    }

    const obj = block as Record<string, unknown>;
    const type = obj['@type'];

    // All schemas must have @context
    if (obj['@context'] !== 'https://schema.org') {
      issues.push(`@context missing or wrong (type: ${type})`);
    }

    if (type === 'CollectionPage') {
      if (!obj['url']) issues.push('CollectionPage missing url');
      if (!obj['name']) issues.push('CollectionPage missing name');
      if (!obj['mainEntity']) issues.push('CollectionPage missing mainEntity (ItemList)');
    }

    if (type === 'BreadcrumbList') {
      const items = (obj['itemListElement'] as unknown[]) ?? [];
      if (!items.length) issues.push('BreadcrumbList has no items');
      items.forEach((item, i) => {
        const it = item as Record<string, unknown>;
        if (!it['name']) issues.push(`BreadcrumbList item ${i + 1} missing name`);
        if (!it['item']) issues.push(`BreadcrumbList item ${i + 1} missing item (URL)`);
      });
    }

    if (type === 'TouristAttraction') {
      if (!obj['name']) issues.push('TouristAttraction missing name');
      if (!obj['geo']) issues.push('TouristAttraction missing geo');
      if (!obj['address']) issues.push('TouristAttraction missing address');
    }

    if (type === 'Event') {
      if (!obj['name']) issues.push('Event missing name');
      if (!obj['startDate']) issues.push('Event missing startDate');
      if (!obj['location']) issues.push('Event missing location');
    }

    if (type === 'WebSite') {
      if (!obj['url']) issues.push('WebSite missing url');
      if (!obj['name']) issues.push('WebSite missing name');
    }
  }

  return issues;
}

// ─── Mobile checks ────────────────────────────────────────────────────────────

function checkMobile(html: string): string[] {
  const issues: string[] = [];

  // Viewport meta
  if (!/name="viewport"/.test(html)) {
    issues.push('Missing <meta name="viewport">');
  } else if (!/width=device-width/.test(html)) {
    issues.push('Viewport meta missing width=device-width');
  }

  // lang attribute
  if (!/<html[^>]+lang=/.test(html)) {
    issues.push('Missing lang attribute on <html>');
  }

  // Check for fixed-pixel inline widths on layout containers (heuristic)
  const fixedWidthMatches = html.match(/style="[^"]*width:\s*\d{3,}px[^"]*"/g) ?? [];
  const suspicious = fixedWidthMatches.filter(
    (m) => !m.includes('position') && !m.includes('transform'),
  );
  if (suspicious.length > 0) {
    issues.push(
      `Potential fixed-width inline styles (${suspicious.length} found) — verify manually`,
    );
  }

  return issues;
}

// ─── Run audit ────────────────────────────────────────────────────────────────

interface AuditResult {
  label: string;
  url: string;
  status: number;
  templateType: string;
  schemaIssues: string[];
  mobileIssues: string[];
  jsonLdTypes: string[];
  expectedTypes: string[];
  missingTypes: string[];
  ok: boolean;
}

async function auditPage(sample: (typeof SAMPLE)[0]): Promise<AuditResult> {
  const url = `${CRAWL_BASE}${sample.path}`;
  const { status, html } = await fetchHtml(url);

  const blocks = extractJsonLd(html);
  const jsonLdTypes = allTypes(blocks);
  const schemaIssues = validateSchema(blocks);
  const mobileIssues = checkMobile(html);

  // Check all expected @types are present
  const missingTypes = sample.expectedTypes.filter(
    (t) => !jsonLdTypes.includes(t),
  );
  if (missingTypes.length > 0) {
    schemaIssues.push(`Missing expected @types: ${missingTypes.join(', ')}`);
  }

  if (status !== 200) {
    schemaIssues.push(`HTTP ${status}`);
  }

  const ok =
    status === 200 &&
    schemaIssues.length === 0 &&
    mobileIssues.length === 0;

  return {
    label: sample.label,
    url,
    status,
    templateType: sample.templateType,
    schemaIssues,
    mobileIssues,
    jsonLdTypes,
    expectedTypes: sample.expectedTypes,
    missingTypes,
    ok,
  };
}

async function main() {
  console.log('\n🔍  MyActivity.ca — Schema + Mobile Audit');
  console.log(`   Target: ${CRAWL_BASE}`);
  console.log(`   Sample: ${SAMPLE.length} pages across all template types\n`);

  const results: AuditResult[] = [];
  for (const sample of SAMPLE) {
    process.stdout.write(`  Auditing ${sample.label}…`);
    const result = await auditPage(sample);
    results.push(result);
    const icon = result.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(
      `\r  ${icon} ${sample.label.padEnd(50)} [${result.jsonLdTypes.join(', ') || 'none'}]`,
    );
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(`\n──────────────────────────────────────────────────────`);
  console.log(`  Audited: ${results.length}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log(`──────────────────────────────────────────────────────\n`);

  // ─── Detailed failure output ───────────────────────────────────────────────
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`\x1b[31m✗\x1b[0m ${r.label}`);
    for (const iss of r.schemaIssues) console.log(`  Schema: ${iss}`);
    for (const iss of r.mobileIssues) console.log(`  Mobile: ${iss}`);
  }

  // ─── Markdown report ──────────────────────────────────────────────────────

  const dateStr = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# MyActivity.ca — Schema & Mobile Audit`,
    ``,
    `**Date:** ${dateStr}  `,
    `**Target:** ${CRAWL_BASE}  `,
    ``,
    `---`,
    ``,
    `## Summary`,
    ``,
    `| Pages audited | Passed | Failed |`,
    `|---------------|--------|--------|`,
    `| ${results.length} | ${passed} | ${failed} |`,
    ``,
    `---`,
    ``,
    `## Page-by-page results`,
    ``,
  ];

  for (const r of results) {
    const status = r.ok ? '✅' : '❌';
    lines.push(`### ${status} ${r.label}`);
    lines.push(``);
    lines.push(`- **URL:** ${r.url}`);
    lines.push(`- **HTTP status:** ${r.status}`);
    lines.push(`- **Template type:** ${r.templateType}`);
    lines.push(
      `- **JSON-LD @types found:** ${r.jsonLdTypes.length > 0 ? r.jsonLdTypes.join(', ') : '_none_'}`,
    );
    if (r.expectedTypes.length > 0) {
      lines.push(`- **Expected @types:** ${r.expectedTypes.join(', ')}`);
    }
    if (r.schemaIssues.length > 0) {
      lines.push(`- **Schema issues:**`);
      r.schemaIssues.forEach((i) => lines.push(`  - ${i}`));
    } else {
      lines.push(`- **Schema:** ✅ Valid`);
    }
    if (r.mobileIssues.length > 0) {
      lines.push(`- **Mobile issues:**`);
      r.mobileIssues.forEach((i) => lines.push(`  - ${i}`));
    } else {
      lines.push(`- **Mobile:** ✅ Viewport + lang present, no fixed-width containers`);
    }
    lines.push(``);
  }

  lines.push(`---`, ``, `*Generated by \`scripts/audit-schema-mobile.ts\`*`);

  const report = lines.join('\n');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const reportPath = path.join(docsDir, `schema-mobile-audit-${dateStr}.md`);
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`📄  Report: ${reportPath}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
