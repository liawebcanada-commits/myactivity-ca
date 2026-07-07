# MyActivity.ca — Project Archive

> Complete build session record. Use this document as the single source of truth
> for what was built, every architectural decision made, and what to do next.

**Session date:** 2026-07-07  
**Build duration:** ~2 hours (across multiple prompts)  
**Final commit:** `016c12d` on `main`  
**Live URL:** https://myactivity-ca.vercel.app  
**Release tag:** [v1.0.0-phase1](https://github.com/liawebcanada-commits/myactivity-ca/releases/tag/v1.0.0-phase1)

---

## 1. Session Summary

Built **MyActivity.ca** from zero to production in a single session, starting from a blank directory and ending with a fully deployed, crawl-verified, schema-audited bilingual directory.

### What was delivered

| Deliverable | Location | Status |
|-------------|----------|--------|
| Next.js 14 App Router project | `/` | ✅ |
| 12-city × 8-category × 4-season data | `/data/` | ✅ |
| 314 statically generated pages | Vercel | ✅ |
| Bilingual routing (EN/FR) | `middleware.ts` | ✅ |
| JSON-LD schema on all page types | `lib/schema.ts` | ✅ |
| Québec Law 25 consent banner | `components/ConsentBanner.tsx` | ✅ |
| Locale-split sitemaps | `app/sitemap.ts` | ✅ |
| CI pipeline (GitHub Actions) | `.github/workflows/ci.yml` | ✅ |
| Hreflang validation script | `scripts/validate-hreflang.ts` | ✅ |
| Duplicate content guard | `scripts/check-duplicate-content.ts` | ✅ |
| Full site crawl (314/314 pass) | `scripts/crawl-verify.ts` | ✅ |
| Schema + mobile audit (10/10 pass) | `scripts/audit-schema-mobile.ts` | ✅ |
| 90-day content calendar | `docs/90-day-content-calendar.md` | ✅ |
| 18-prospect outreach log | `data/outreach-log.json` | ✅ |
| README with deployment steps | `README.md` | ✅ |

---

## 2. Commit History

| Hash | Message | Files changed |
|------|---------|---------------|
| `313fe56` | feat: initial scaffold — MyActivity.ca v1 | 63 files |
| `a7ab076` | fix: production build — setRequestLocale, ESLint config, guide fs loader | 11 files |
| `074d970` | feat: add crawl-verify script + passing crawl report | 2 files |
| `b2a8e7c` | fix: emit Event JSON-LD on festivals-events category pages | 3 files |
| `a3e1985` | docs: schema + mobile audit report — 10/10 passed | 1 file |
| `016c12d` | docs: add comprehensive README | 1 file |

---

## 3. Architectural Decisions Log

Every non-obvious decision made during the session, with rationale.

### 3.1 French URL path segments (`/fr/activites/` not `/fr/activities/`)

**Decision:** Use locale-specific path segments in French URLs per the spec Section 3.  
**Implementation:** next-intl `pathnames` config in `middleware.ts` rewrites `/fr/activites/[city]` to the internal `app/[locale]/activities/[city]/page.tsx` handler.  
**Rationale:** French-speaking Québécois users and search engines expect French URLs. The AstrologySky.com case study in the spec showed that getting hreflang wrong causes thousands of pages to be unindexed — using the same path segments in both locales is a common mistake.  
**File:** `middleware.ts` — `pathnames` config; `lib/urls.ts` — `cityPath()`, `seasonalPath()` helpers.

### 3.2 `setRequestLocale(locale)` required in every server component

**Decision:** Call `setRequestLocale(locale)` at the top of every async server component before calling `getTranslations()`.  
**Discovered:** During the first Vercel build — all 327 pages failed with `DYNAMIC_SERVER_USAGE` because next-intl v3 defaults to dynamic rendering without this call.  
**Fix commit:** `a7ab076`  
**File:** All 9 page components + layout.

### 3.3 `fs.readFileSync` instead of dynamic `import()` for guide pages

**Decision:** The guide page loads `data/guides/{slug}.json` using `fs.readFileSync`, not `import()`.  
**Rationale:** Next.js's bundler statically analyses `import()` calls and tries to resolve the path at build time, failing with "Module not found" when `data/guides/` doesn't exist yet. `fs.readFileSync` is a runtime call and is not analysed by the bundler.  
**Fix commit:** `a7ab076`  
**File:** `app/[locale]/guide/[slug]/page.tsx`

### 3.4 App Router native `sitemap.ts` with `generateSitemaps()`

**Decision:** Use Next.js App Router's built-in `app/sitemap.ts` with `generateSitemaps()` instead of `next-sitemap` for locale splitting.  
**Rationale:** `next-sitemap` runs as a postbuild script and doesn't have access to Next.js's alternates metadata API. The App Router native approach generates `/sitemap/en.xml` and `/sitemap/fr.xml` with proper `alternates.languages` entries, which is exactly what GSC needs for bilingual hreflang verification.  
**File:** `app/sitemap.ts`

### 3.5 `buildAlternateUrls()` returning `{ canonical, languages }` shape

**Decision:** The `buildAlternateUrls` helper returns the Next.js `Metadata['alternates']` shape with both `canonical` and `languages`.  
**Critical:** Every page must emit a **self-referencing** canonical pointing to the locale-specific URL (e.g. `/fr/activites/montreal`, not `/fr/activities/montreal`). Cross-locale canonicals were the exact failure mode on AstrologySky.com.  
**File:** `lib/urls.ts` — `cityAlternates()`, `categoryAlternates()`, `seasonalAlternates()`

### 3.6 `Event` schema on category pages, not just seasonal hubs

**Decision:** `generateEventSchema()` is called on category pages for any activity with `event_start_date`, not only on seasonal hub pages.  
**Discovered:** The schema audit (`scripts/audit-schema-mobile.ts`) failed the Montréal festivals-events category page for missing `Event` schema. Just For Laughs, the Calgary Stampede, and the Québec Carnival all have dated `event_start_date` fields and appear on their respective festivals-events category pages.  
**Fix commit:** `b2a8e7c`  
**File:** `app/[locale]/activities/[city]/[category]/page.tsx`

### 3.7 Consent-gated GA4 + AdSense injection

**Decision:** GA4 and AdSense script tags are never in the initial HTML. They are injected dynamically by `ConsentBanner.tsx` via `document.createElement('script')` only after the user clicks "Accept All".  
**Rationale:** Québec Law 25 requires explicit, freely-given, specific consent before any tracking. Pre-loading and then blocking does not satisfy the requirement — the scripts must never load without consent.  
**File:** `components/ConsentBanner.tsx` — `activateTracking()` function

### 3.8 Regex case-sensitivity in crawl script

**Issue:** First crawl run reported 314/314 failures on hreflang. Root cause: Next.js renders `hrefLang` (camelCase) not `hreflang` (lowercase). The regex patterns lacked the `/i` flag.  
**Fix:** Added `/i` flag to all `extractMeta()` regexes in `scripts/crawl-verify.ts`.

---

## 4. Files & Directories Index

### Key configuration files

| File | Purpose |
|------|---------|
| `middleware.ts` | next-intl routing + FR path translation |
| `i18n.ts` | next-intl request config (locale resolution) |
| `navigation.ts` | Typed `Link`, `useRouter` from next-intl |
| `next.config.js` | next-intl plugin wrapper |
| `tailwind.config.ts` | Canadian red brand colours (`brand-red: #D52B1E`) |
| `.env.example` | All env var placeholders with comments |
| `.github/workflows/ci.yml` | CI: tsc → lint → build → hreflang → duplicate |

### Key library files

| File | Exports |
|------|---------|
| `lib/urls.ts` | `cityPath`, `categoryPath`, `seasonalPath`, `*Alternates()` — all locale-aware URL builders |
| `lib/seo-meta.ts` | `cityTitle`, `categoryTitle`, `cityDescription`, etc. — formula-based SEO meta |
| `lib/schema.ts` | `generateCollectionPageSchema`, `generateTouristAttractionSchema`, `generateEventSchema`, `generateBreadcrumbSchema`, `generateWebSiteSchema` |
| `lib/data.ts` | Data loaders + `generateStaticParams` helpers |
| `lib/metadata.ts` | `buildPageMetadata`, `buildAlternates` (legacy; most pages now use `lib/urls.ts` directly) |

---

## 5. Quality Audit Results

### Crawl verification (2026-07-07)

```
314 / 314 pages passed (100%)
0 HTTP 404s
0 canonical mismatches
0 missing hreflang tags
Duration: 2.5s
```

Report: `docs/crawl-report-2026-07-07.md`

### Schema + mobile audit (2026-07-07)

```
10 / 10 sample pages passed (100%)
All JSON-LD @types valid (WebSite, CollectionPage, TouristAttraction, Event, BreadcrumbList)
All pages: viewport meta ✅  lang attr ✅  no fixed-width containers ✅
```

Report: `docs/schema-mobile-audit-2026-07-07.md`

### CI scripts

```
npm run validate-hreflang  → ✅  157 URL pairs, 314 total pages, 0 errors
npm run check-duplicate    → ✅  1,770 pairs checked, 0 exceed 15% overlap
npm run seo-health         → ⚠️  60 affiliate stubs, 6 stale events, 40 thin descriptions
                                 (all expected at launch — see docs/seo-health-report-2026-07-07.md)
```

---

## 6. Known Issues and Pending Work

### Before DNS cutover (blocking)

- [ ] **Custom domain in Vercel:** Add `myactivity.ca` in Project → Settings → Domains
- [ ] **Set production env vars in Vercel:** `NEXT_PUBLIC_SITE_URL=https://myactivity.ca`, GA4, AdSense, all affiliate IDs
- [ ] **GSC verification:** Add both locale sitemaps (`/sitemap/en.xml`, `/sitemap/fr.xml`) to Google Search Console after DNS propagates

### Within 30 days of launch (non-blocking)

- [ ] **Affiliate accounts:** Apply for GetYourGuide, Viator, Groupon, Ticketmaster CA. Replace all 60 `#AFFILIATE_LINK` stubs in `data/activities/*.json` once approved.
- [ ] **Thin content:** SEO health report flagged 40 activity descriptions below 150 words. Run `npm run seo-health` to see which ones, then expand them.
- [ ] **Stale event dates:** 6 festival activities have `event_start_date` in the past. Update dates before indexation stabilises (stale dates are a negative ranking signal).
- [ ] **AdSense approval:** Apply after domain + content are live. Slot IDs go into `NEXT_PUBLIC_ADSENSE_SLOT_CITY` and `NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY`.

### Phase 2 (per 90-day calendar)

- [ ] Weeks 3–6: publish 4 editorial guides (`/guide/[slug]`) — see `docs/90-day-content-calendar.md`
- [ ] Weeks 7–10: expand city matrix by 3–5 cities based on GSC impression data
- [ ] Weeks 11–13: first monthly SEO health report review + underperformer rewrites

---

## 7. Document Index

| Document | Purpose | Updated |
|----------|---------|---------|
| `README.md` | Developer setup, env vars, deployment steps | 2026-07-07 |
| `docs/90-day-content-calendar.md` | Post-launch content + SEO plan | 2026-07-07 |
| `docs/crawl-report-2026-07-07.md` | 314-page HTTP + canonical crawl results | 2026-07-07 |
| `docs/schema-mobile-audit-2026-07-07.md` | JSON-LD + mobile audit results | 2026-07-07 |
| `docs/seo-health-report-2026-07-07.md` | Thin content / stubs / stale events flags | 2026-07-07 |
| `docs/PROJECT-ARCHIVE.md` | **This file** — full session record | 2026-07-07 |
| `data/outreach-log.json` | 18-prospect link-building prospect list | 2026-07-07 |

---

*Session complete. Repository: https://github.com/liawebcanada-commits/myactivity-ca*
