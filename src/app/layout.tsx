import type {Metadata, Viewport} from 'next';
import {headers} from 'next/headers';
import {HtmlLocaleSync} from '@/components/HtmlLocaleSync';
import {PwaInstallPrompt} from '@/components/PwaInstallPrompt';
import './globals.css';

const siteUrl = 'https://7phone.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '7Phone Bahrain',
    template: '%s | 7Phone Bahrain'
  },
  description: 'Bilingual product catalog for 7phone Bahrain with WhatsApp ordering.',
  alternates: {
    canonical: '/',
    languages: {
      ar: '/ar',
      en: '/en'
    }
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: '7Phone Bahrain',
    title: '7Phone Bahrain',
    description: 'Phones, accessories, offers, repair service, and WhatsApp ordering in Bahrain.',
    images: [
      {
        url: '/images/7phone-logo.svg',
        width: 512,
        height: 512,
        alt: '7Phone Bahrain'
      }
    ]
  },
  twitter: {
    card: 'summary',
    title: '7Phone Bahrain',
    description: 'Phones, accessories, offers, repair service, and WhatsApp ordering in Bahrain.',
    images: ['/images/7phone-logo.svg']
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/images/7phone-logo.svg',
    shortcut: '/images/7phone-logo.svg',
    apple: '/images/7phone-logo.svg'
  }
};

export const viewport: Viewport = {
  themeColor: '#ff008c'
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get('x-sevenphone-locale') === 'en' ? 'en' : 'ar';
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <HtmlLocaleSync />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
