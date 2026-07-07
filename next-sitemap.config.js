/** @type {import('next-sitemap').IConfig} */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://myactivity.ca';

module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: true,

  // Exclude utility / low-value pages from sitemap
  exclude: [
    '*/contact',
    '/api/*',
  ],

  // Alternate refs for every URL — next-sitemap adds these to all URLs
  alternateRefs: [
    {
      href: `${SITE_URL}/en`,
      hreflang: 'en-CA',
    },
    {
      href: `${SITE_URL}/fr`,
      hreflang: 'fr-CA',
    },
  ],

  // Custom priority by page type
  transform: async (config, path) => {
    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/en' || path === '/fr') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.match(/\/activities\/[^/]+$/) || path.match(/\/activites\/[^/]+$/)) {
      // City hub pages
      priority = 0.9;
      changefreq = 'weekly';
    } else if (path.includes('/activities/') || path.includes('/activites/')) {
      // City + category pages
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.includes('/seasonal/') || path.includes('/saison/')) {
      priority = 0.7;
      changefreq = 'monthly';
    } else if (path.includes('/guide/')) {
      priority = 0.6;
      changefreq = 'monthly';
    } else if (path.includes('/privacy') || path.includes('/about')) {
      priority = 0.3;
      changefreq = 'yearly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/sitemap.xml`,
    ],
  },
};
