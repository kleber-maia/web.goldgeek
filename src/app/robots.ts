import type { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://goldgeek.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep crawlers out of the authenticated dashboards and API surface.
        disallow: ['/account', '/admin', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
