import Link from 'next/link';
import {getTranslations} from 'next-intl/server';
import {Logo} from './Logo';
import type {Locale, StoreSettings} from '@/lib/types';

export async function Header({locale, settings}: {locale: Locale; settings: StoreSettings}) {
  const t = await getTranslations();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101014] text-white shadow-sm">
      <div className="bg-brand-pink px-4 py-1.5 text-center text-xs font-bold text-white">
        {t('promo')}
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href={`/${locale}`} aria-label="7phone home">
          <Logo logoUrl={settings.logoUrl} />
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href={settings.mapsUrl}
            className="hidden h-9 items-center rounded-lg border border-white/12 px-3 text-xs font-bold text-white/76 hover:border-brand-neon hover:text-white md:inline-flex"
          >
            {t('location')}
          </a>
          <a
            href={`tel:${settings.phoneSales}`}
            className="inline-flex h-9 items-center rounded-lg bg-white px-3 text-xs font-black text-brand-black hover:bg-brand-neon hover:text-white"
          >
            {t('call')}
          </a>
          <Link
            href={`/${locale}/admin/products`}
            className="hidden h-9 items-center rounded-lg border border-white/12 px-3 text-xs font-bold text-white/76 hover:border-brand-neon hover:text-white sm:inline-flex"
          >
            Admin
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="inline-flex h-9 items-center rounded-lg border border-brand-neon/80 px-3 text-xs font-black text-brand-neon hover:bg-brand-neon hover:text-white"
          >
            {otherLocale.toUpperCase()}
          </Link>
        </nav>
      </div>
    </header>
  );
}
