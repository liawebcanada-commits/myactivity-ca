// ─── Locale ──────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'fr';

// ─── Activity / Venue ─────────────────────────────────────────────────────────

export type PriceRange = 'free' | '$' | '$$' | '$$$';
export type Season = 'winter' | 'spring' | 'summer' | 'fall' | 'year-round';
export type CategorySlug =
  | 'indoor-kids'
  | 'outdoor'
  | 'free'
  | 'rainy-day'
  | 'date-night'
  | 'museums-culture'
  | 'festivals-events'
  | 'day-trips';

export interface Activity {
  id: string;
  name_en: string;
  name_fr: string;
  city: string;                      // city slug (e.g. "toronto")
  category: CategorySlug[];
  description_en: string;            // 150–300 words, human-quality
  description_fr: string;            // Québécois French
  address: string;
  lat: number;
  lng: number;
  price_range: PriceRange;
  season: Season[];
  kid_friendly: boolean;
  /** GetYourGuide / Viator / Groupon deep link — use #AFFILIATE_LINK until keys issued */
  affiliate_link: string;
  affiliate_network?: 'getyourguide' | 'viator' | 'groupon' | 'ticketmaster' | null;
  image_url: string;
  image_alt_en?: string;
  image_alt_fr?: string;
  last_updated: string;              // ISO date string
  /** Reserved for future freemium "save to list" feature — do not remove */
  user_id?: string | null;
  /** Only for festivals-events category */
  event_start_date?: string;
  event_end_date?: string;
  event_url?: string;
}

// ─── City ─────────────────────────────────────────────────────────────────────

export interface City {
  slug: string;
  name_en: string;
  name_fr: string;
  province: string;   // two-letter code, e.g. "ON"
  lat: number;
  lng: number;
  population: number;
  featured: boolean;
  image_url?: string;
  description_en?: string;
  description_fr?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  slug: CategorySlug;
  name_en: string;
  name_fr: string;
  icon: string;       // emoji or icon identifier
  description_en: string;
  description_fr: string;
}

// ─── Guide / Editorial ────────────────────────────────────────────────────────

export interface Guide {
  slug: string;
  title_en: string;
  title_fr: string;
  excerpt_en: string;
  excerpt_fr: string;
  content_en: string;
  content_fr: string;
  city?: string;
  category?: CategorySlug;
  published_at: string;
  updated_at: string;
  image_url?: string;
}

// ─── Page params helpers ──────────────────────────────────────────────────────

export interface CityPageParams {
  locale: Locale;
  city: string;
}

export interface CategoryPageParams extends CityPageParams {
  category: CategorySlug;
}

export interface SeasonalPageParams {
  locale: Locale;
  /** Slug format: "{season}-{city}" e.g. "winter-montreal" */
  slug: string;
}
