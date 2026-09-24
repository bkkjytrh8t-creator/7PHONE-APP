import type {MetadataRoute} from 'next';

const siteUrl = 'https://7phone.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/admin/', '/ar/admin/', '/en/admin/', '/admin/']
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
