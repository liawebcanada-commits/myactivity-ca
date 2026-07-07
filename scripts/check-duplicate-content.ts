#!/usr/bin/env node
/**
 * scripts/check-duplicate-content.ts
 *
 * Content similarity check for MyActivity.ca.
 *
 * Reads all activity JSON files, extracts description_en and description_fr
 * for each entry, then computes bigram (2-gram) overlap between every pair
 * of descriptions within the same language.
 *
 * CI fails (exit 1) if any pair exceeds MAX_OVERLAP (default: 15%).
 *
 * This script enforces the same content-quality rule that protected
 * ChickenRecipes.ca from Google's Helpful Content Update.
 *
 * Run: npx ts-node --project tsconfig.json scripts/check-duplicate-content.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const MAX_OVERLAP = 0.15; // 15% n-gram overlap threshold
const dataDir = path.join(process.cwd(), 'data', 'activities');

// ─── N-gram helpers ───────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëîïôöùûüÿœæ\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function bigrams(tokens: string[]): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    grams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return intersection / union;
}

// ─── Load all descriptions ────────────────────────────────────────────────────

type Entry = { id: string; city: string; description_en: string; description_fr: string };

function loadAllDescriptions(): Entry[] {
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  const entries: Entry[] = [];

  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(dataDir, file), 'utf-8'),
    ) as Array<{ id: string; city: string; description_en: string; description_fr: string }>;

    for (const item of raw) {
      if (item.description_en && item.description_fr) {
        entries.push({
          id: item.id,
          city: item.city,
          description_en: item.description_en,
          description_fr: item.description_fr,
        });
      }
    }
  }

  return entries;
}

// ─── Compare all pairs ────────────────────────────────────────────────────────

type DuplicateResult = {
  a: string;
  b: string;
  lang: 'en' | 'fr';
  similarity: number;
};

function findDuplicates(entries: Entry[]): DuplicateResult[] {
  const violations: DuplicateResult[] = [];

  // Pre-compute bigrams for all entries
  const enGrams = entries.map((e) => bigrams(bigrams(tokenize(e.description_en)).keys() as unknown as string[]));
  const frGrams = entries.map((e) => bigrams(bigrams(tokenize(e.description_fr)).keys() as unknown as string[]));

  // Fix: compute bigrams correctly
  const enBigrams = entries.map((e) => bigrams(tokenize(e.description_en)));
  const frBigrams = entries.map((e) => bigrams(tokenize(e.description_fr)));

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const enSim = jaccardSimilarity(enBigrams[i], enBigrams[j]);
      if (enSim > MAX_OVERLAP) {
        violations.push({
          a: entries[i].id,
          b: entries[j].id,
          lang: 'en',
          similarity: enSim,
        });
      }

      const frSim = jaccardSimilarity(frBigrams[i], frBigrams[j]);
      if (frSim > MAX_OVERLAP) {
        violations.push({
          a: entries[i].id,
          b: entries[j].id,
          lang: 'fr',
          similarity: frSim,
        });
      }
    }
  }

  return violations;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const entries = loadAllDescriptions();
console.log(`\n📄  Loaded ${entries.length} activity descriptions from ${dataDir}`);

const violations = findDuplicates(entries);

if (violations.length > 0) {
  console.error(`\n❌  Content similarity check FAILED (threshold: ${MAX_OVERLAP * 100}%):\n`);
  for (const v of violations) {
    console.error(
      `  • [${v.lang.toUpperCase()}] ${v.a} ↔ ${v.b}: ${(v.similarity * 100).toFixed(1)}% overlap`,
    );
  }
  console.error(
    `\n${violations.length} pair(s) exceed the ${MAX_OVERLAP * 100}% threshold.\n` +
    `Rewrite the flagged descriptions before deploying.\n`,
  );
  process.exit(1);
}

console.log(
  `\n✅  No duplicate content detected. All ${entries.length * (entries.length - 1) / 2} pairs are below ${MAX_OVERLAP * 100}% bigram overlap.\n`,
);
