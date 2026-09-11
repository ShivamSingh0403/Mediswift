import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mediswift.in';

  const staticRoutes = [
    '',
    '/medicines',
    '/doctors',
    '/appointments',
    '/categories',
    '/prescriptions',
    '/checkout',
    '/orders',
    '/account',
    '/wishlist',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return staticRoutes;
}
