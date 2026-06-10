import type {Metadata, Viewport} from 'next';
import {PwaInstallPrompt} from '@/components/PwaInstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: '7phone Bahrain',
  description: 'Bilingual product catalog for 7phone Bahrain with WhatsApp ordering.',
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
