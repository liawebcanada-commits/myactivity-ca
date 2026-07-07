# MyActivity.ca

Bilingual (EN-CA / FR-CA) Canadian "things to do" directory — 312 programmatic static pages targeting local and seasonal long-tail search intent, monetized via travel/experience affiliates and AdSense, fully Québec Law 25 compliant.

**Live:** https://myactivity-ca.vercel.app · **Production domain:** https://myactivity.ca (pending DNS)  
**Repo:** https://github.com/liawebcanada-commits/myactivity-ca · **Release:** [v1.0.0-phase1](https://github.com/liawebcanada-commits/myactivity-ca/releases/tag/v1.0.0-phase1)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment — Vercel](#deployment--vercel)
- [Adding a New City](#adding-a-new-city)
- [CI / Quality Scripts](#ci--quality-scripts)
- [URL Architecture](#url-architecture)
- [Phase 1 Page Matrix](#phase-1-page-matrix)
- [Acceptance Checklist](#acceptance-checklist)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind CSS |
| i18n | next-intl v3 (`/en/...` + `/fr/...` path routing) |
| Data | Structured JSON in `/data` (no CMS for Phase 1) |
| Sitemap | App Router native `app/sitemap.ts` (split by locale) |
| Hosting | Vercel |
| Analytics | GA4 (consent-gated) |
| Ads | Google AdSense (consent-gated) |

---

## Project Structure

```
/app
  /[locale]
    /activities/[city]/page.tsx          ← city hub
    /activities/[city]/[category]/page.tsx ← city + category
    /seasonal/[slug]/page.tsx            ← seasonal hub
    /guide/[slug]/page.tsx               ← editorial guide
    /about|privacy|contact/page.tsx      ← static pages
    /page.tsx                            ← homepage
    /layout.tsx                          ← root locale layout
  /api/revalidate/route.ts               ← ISR webhook
  /sitemap.ts                            ← locale-split sitemap
  /robots.ts
/components
  ActivityCard.tsx    ConsentBanner.tsx
  CityHub.tsx         LocaleSwitcher.tsx
  CategoryFilter.tsx  Breadcrumbs.tsx
  Navigation.tsx      Footer.tsx
  AdUnit.tsx
/data
  cities.json         categories.json
  /activities/[city].json (12 files)
  outreach-log.json
/docs
  90-day-content-calendar.md
  crawl-report-*.md
  schema-mobile-audit-*.md
/lib
  data.ts      schema.ts    seo-meta.ts
  metadata.ts  urls.ts
/messages
  en.json      fr.json
/scripts
  validate-hreflang.ts       ← CI: hreflang pair check
  check-duplicate-content.ts ← CI: 15% bigram overlap guard
  crawl-verify.ts            ← full 314-page HTTP + canonical crawl
  seo-health-report.ts       ← monthly audit report
  audit-schema-mobile.ts     ← JSON-LD + mobile viewport check
/types
  index.ts
middleware.ts  i18n.ts  navigation.ts
next.config.js  tailwind.config.ts
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/liawebcanada-commits/myactivity-ca.git
cd myactivity-ca

# 2. Install dependencies
npm install

# 3. Set up env vars
cp .env.example .env.local
# → edit .env.local with your values (see Environment Variables below)

# 4. Start dev server
npm run dev
# → http://localhost:3000/en  (redirects / → /en automatically)
```

### Useful dev commands

```bash
npm run build          # production build (also runs postbuild → sitemap)
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript check

# CI scripts (no server needed — read from data/ files)
npm run validate-hreflang   # verify all EN/FR URL pairs present
npm run check-duplicate     # bigram similarity check across all descriptions
npm run seo-health          # generate docs/seo-health-report-{date}.md

# Run against live site
CRAWL_BASE=https://myactivity-ca.vercel.app npx tsx scripts/crawl-verify.ts
CRAWL_BASE=https://myactivity-ca.vercel.app npx tsx scripts/audit-schema-mobile.ts
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development. In Vercel, set these under **Project → Settings → Environment Variables**.

### Required for production

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical domain, no trailing slash | Set to `https://myactivity.ca` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID | [GA4 console](https://analytics.google.com) → Data Streams |
| `NEXT_PUBLIC_ADSENSE_ID` | AdSense publisher ID (`ca-pub-…`) | [AdSense console](https://adsense.google.com) → Account → Account info |
| `NEXT_PUBLIC_ADSENSE_SLOT_CITY` | Ad slot ID for city hub pages | AdSense → Ads → By ad unit |
| `NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY` | Ad slot ID for category pages | AdSense → Ads → By ad unit |
| `REVALIDATE_SECRET` | Secret for `POST /api/revalidate` webhook | Generate: `openssl rand -hex 32` |

### Affiliate networks (replace `#AFFILIATE_LINK` stubs once approved)

| Variable | Network | Apply at |
|----------|---------|----------|
| `GETYOURGUIDE_AFFILIATE_ID` | GetYourGuide (primary) | [partner.getyourguide.com](https://partner.getyourguide.com) |
| `VIATOR_AFFILIATE_ID` | Viator / Tripadvisor | [partner.viator.com](https://www.partner.viator.com) |
| `GROUPON_AFFILIATE_ID` | Groupon Canada | Via CJ Affiliate or direct |
| `TICKETMASTER_AFFILIATE_ID` | Ticketmaster Canada | [affiliate.ticketmaster.ca](https://affiliate.ticketmaster.ca) |

> **Affiliate tokens:** Until accounts are approved, all `affiliate_link` fields in activity JSON files use the placeholder `#AFFILIATE_LINK`. The `ActivityCard` component suppresses the CTA button for any activity whose `affiliate_link` equals `#AFFILIATE_LINK`. When keys are issued, update the individual activity JSON files and set the env vars for any programmatic link construction.

### Optional / local only

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTACT_EMAIL` | `contact@liaweb.ca` | Shown on privacy policy |
| `CRAWL_BASE` | `https://myactivity-ca.vercel.app` | Override for crawl scripts |
| `CANONICAL_BASE` | `https://myactivity.ca` | Override for crawl scripts |

### Law 25 / consent note

GA4 and AdSense scripts are **never loaded until the user explicitly accepts** the consent banner. The `ConsentBanner` component injects them dynamically post-acceptance, keyed off `localStorage['myactivity_consent'] === 'accepted'`. Declining stores `'declined'` and the scripts remain unloaded for the entire session.

---

## Deployment — Vercel

### Initial setup (one-time)

1. **Connect repo:** Vercel Dashboard → New Project → import `liawebcanada-commits/myactivity-ca`
2. **Framework preset:** Next.js (auto-detected)
3. **Set env vars:** Project → Settings → Environment Variables — add all variables from the table above
4. **Custom domain:** Project → Settings → Domains → add `myactivity.ca`
   - Add a CNAME `www` → `cname.vercel-dns.com`
   - Add an A record for apex: `76.76.21.21`
   - Redirect `www.myactivity.ca` → `myactivity.ca` (Vercel handles this in the dashboard)

### Continuous deployment

Every push to `main` triggers an automatic Vercel production deployment. Preview deployments are created for all other branches.

The `.github/workflows/ci.yml` pipeline runs on every push/PR:

```
tsc --noEmit → eslint → next build → validate-hreflang → check-duplicate-content
```

All checks must pass before a PR can be merged.

### ISR revalidation webhook

For content updates outside of a full rebuild, POST to `/api/revalidate`:

```bash
curl -X POST https://myactivity.ca/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"city": "montreal", "locale": "fr"}'
```

Accepted body shapes:
- `{ "path": "/en/activities/toronto" }` — revalidate a single page
- `{ "tag": "activities-montreal" }` — revalidate by cache tag
- `{ "city": "montreal", "locale": "fr" }` — revalidate all city pages for a locale

---

## Adding a New City

Adding a 13th (or 20th) city requires only a **data change** — no code changes.

```bash
# 1. Add city entry to data/cities.json
#    Follow the existing schema (slug, name_en, name_fr, province, lat, lng, ...)

# 2. Create data/activities/{city-slug}.json
#    Add ≥ 5 activities following the Activity schema in types/index.ts
#    Each description must be 150–300 words (enforced by seo-health script)

# 3. Verify no regressions
npm run validate-hreflang   # new city's URL pairs should appear automatically
npm run check-duplicate     # new descriptions must be below 15% overlap

# 4. Build to confirm all pages generate
npm run build

# 5. Commit and push → Vercel deploys automatically
```

`generateStaticParams()` in every page template reads from `data/cities.json` at build time, so the new city's 16 pages (8 categories × 2 locales) plus 8 seasonal hubs (4 seasons × 2 locales) will be pre-rendered automatically.

---

## CI / Quality Scripts

| Script | Command | What it checks |
|--------|---------|----------------|
| **Hreflang validation** | `npm run validate-hreflang` | Every EN URL has a paired FR URL with correct `/activites/` or `/saison/` segment. Fails CI if any pair is missing. |
| **Duplicate content** | `npm run check-duplicate` | Bigram (2-gram) Jaccard similarity across all activity descriptions. Fails if any pair > 15% overlap. Guards against Google Helpful Content Update penalties. |
| **SEO health report** | `npm run seo-health` | Writes `docs/seo-health-report-{date}.md`. Flags thin content (< 150 words), stale event dates, `#AFFILIATE_LINK` stubs. |
| **Full site crawl** | `npx tsx scripts/crawl-verify.ts` | HTTP 200, canonical URL, hreflang pair, `<h1>` for all 314 pages. |
| **Schema + mobile audit** | `npx tsx scripts/audit-schema-mobile.ts` | JSON-LD field validation + mobile viewport check for a 10-page representative sample. |

All scripts exit 0 on success and 1 on failure, making them safe to wire into any CI pipeline.

---

## URL Architecture

```
/en                                     → Homepage (EN)
/fr                                     → Homepage (FR)
/en/activities/[city]                   → City hub (EN)
/fr/activites/[ville]                   → City hub (FR) ← different path segment
/en/activities/[city]/[category]        → City × category (EN)
/fr/activites/[ville]/[categorie]       → City × category (FR)
/en/seasonal/[season]-[city]            → Seasonal hub (EN)
/fr/saison/[saison]-[ville]             → Seasonal hub (FR) ← different path segment
/en/guide/[slug]                        → Editorial guide (EN)
/fr/guide/[slug]                        → Editorial guide (FR)
/en/about  /en/privacy  /en/contact     ← static pages
/fr/about  /fr/privacy  /fr/contact
/sitemap/en.xml  /sitemap/fr.xml        ← locale sitemaps
/robots.txt
```

**Hreflang rules:**
- Every page emits self-referencing canonical (locale-specific, never cross-locale)
- Every page emits reciprocal `en-CA` + `fr-CA` + `x-default` alternates
- French paths use ASCII slugs (accents stripped): `montreal` not `montréal`

The path translation is handled by the next-intl middleware in `middleware.ts` — `/fr/activites/[city]` is internally rewritten to the `app/[locale]/activities/[city]/page.tsx` handler.

---

## Phase 1 Page Matrix

| | Indoor | Outdoor | Free | Rainy Day | Date Night | Museums | Festivals | Day Trips |
|---|---|---|---|---|---|---|---|---|
| Toronto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Montréal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vancouver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calgary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ottawa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edmonton | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Winnipeg | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Québec City | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hamilton | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kitchener-Waterloo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Halifax | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chambly | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Each cell = 1 EN page + 1 FR page = **192 category pages**.  
Plus 12 city hubs (×2) + 48 seasonal hubs (×2) + 2 homepages = **314 total pre-rendered pages**.

---

## Acceptance Checklist

From the production spec (Section 11):

- [x] All 312 Phase 1 pages build with zero 404s (verified: 314/314 HTTP 200)
- [x] `validate-hreflang` passes — zero missing reciprocal pairs (157 pairs, all valid)
- [x] `check-duplicate` passes — no page > 15% bigram overlap (1,770 pairs checked)
- [x] JSON-LD validates with zero errors (10-page sample: all schema types and required fields present)
- [x] Law 25 consent banner blocks GA4/AdSense pre-consent, both languages
- [x] LocaleSwitcher shows Canadian flag only (both locales)
- [x] Sitemap index + locale sitemaps live (`/sitemap.xml`, `/sitemap/en.xml`, `/sitemap/fr.xml`)
- [x] `robots.txt` live, disallows `/api/`
- [x] Mobile responsive: viewport, lang attr, Tailwind responsive classes on all templates
- [x] Affiliate link tokens swappable via `data/activities/*.json` + env vars
- [ ] GA4 + GSC verified on production domain ← pending DNS cutover
- [ ] AdSense approved and slot IDs set ← pending application
- [ ] Affiliate link stubs replaced with live links ← pending partner approvals

---

## Data Model

Full TypeScript types in `types/index.ts`. Core activity schema:

```typescript
interface Activity {
  id: string;              // URL-safe slug, e.g. "toronto-cn-tower"
  name_en: string;
  name_fr: string;         // Québécois French
  city: string;            // city slug from data/cities.json
  category: CategorySlug[];
  description_en: string;  // 150–300 words
  description_fr: string;  // 150–300 words
  address: string;
  lat: number;
  lng: number;
  price_range: 'free' | '$' | '$$' | '$$$';
  season: Season[];
  kid_friendly: boolean;
  affiliate_link: string;  // '#AFFILIATE_LINK' until keys issued
  affiliate_network?: 'getyourguide' | 'viator' | 'groupon' | 'ticketmaster' | null;
  image_url: string;
  last_updated: string;    // ISO date
  user_id?: string | null; // reserved for future freemium feature
  event_start_date?: string;
  event_end_date?: string;
  event_url?: string;
}
```

---

## Compliance

**Québec Law 25** — The site collects no personal data without consent. GA4 and AdSense are loaded only after explicit opt-in via the `ConsentBanner` component. The privacy policy (EN + FR) at `/en/privacy` and `/fr/privacy` covers:
- Data collected (analytics, advertising)
- Retention period (14 months, GA4 default)
- Third parties (Google, affiliate networks)
- User rights under Law 25 (access, correction, deletion)
- Opt-out mechanism (cookie banner → decline, or clear localStorage)
- Contact: `contact@liaweb.ca`

**WCAG 2.1 AA** — `alt` text on all activity images, one `<h1>` per page, keyboard-navigable category filters, colour contrast ≥ 4.5:1 on all text elements.

---

## License

Private — all rights reserved. © 2026 LiaWeb / MyActivity.ca.
