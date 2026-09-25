import type {MetadataRoute} from 'next';
import {getProducts} from '@/lib/data';
import {directPurchaseUrl} from '@/lib/directPurchase';

const siteUrl = 'https://7phone.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/ar`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${siteUrl}/en`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    }
  ];

  const productRoutes = products.flatMap((product) => {
    const lastModified = product.created_at ? new Date(product.created_at) : now;

    return [
      {
        url: directPurchaseUrl(product, 'ar'),
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.9
      },
      {
        url: `${siteUrl}/ar/product/${product.id}`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8
      },
      {
        url: `${siteUrl}/en/product/${product.id}`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8
      }
    ];
  });

  return [...staticRoutes, ...productRoutes];
}
