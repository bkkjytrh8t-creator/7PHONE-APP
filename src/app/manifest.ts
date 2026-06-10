import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '7Phone',
    short_name: '7Phone',
    description: 'مساعد مبيعات ذكي لمنتجات 7Phone في البحرين',
    start_url: '/ar',
    scope: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#ff008c',
    dir: 'rtl',
    lang: 'ar',
    icons: [
      {src: '/images/7phone-logo.svg', sizes: '192x192', type: 'image/svg+xml'},
      {src: '/images/7phone-logo.svg', sizes: '512x512', type: 'image/svg+xml'}
    ]
  };
}
