import type { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://goldgeek.com').replace(/\/$/, '');

// Public marketing pages only — dashboards and API are excluded (see robots.ts).
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/request-appraisal', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/what-we-buy', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/what-we-pay', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/who-we-are', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-conditions', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency,
    priority,
  }));
}
