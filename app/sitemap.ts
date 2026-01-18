import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zamoraapp.com';

  // 1. Static Routes
  const routes = [
    '',
    '/explore',
    '/promotions',
    '/support',
    '/login',
    '/signup',
    '/privacy-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Property Routes
  // Using public_properties view which should contain active listings
  const { data: properties } = await supabase
    .from('public_properties')
    .select('id, slug, updated_at');

  const propertyRoutes = (properties || []).map((property: any) => ({
    url: `${baseUrl}/book/${property.slug || property.id}`,
    lastModified: property.updated_at ? new Date(property.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...routes, ...propertyRoutes];
}
