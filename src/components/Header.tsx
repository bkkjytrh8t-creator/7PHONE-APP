import {getTranslations} from 'next-intl/server';
import {LanguageSwitchLink} from './LanguageSwitchLink';
import {Logo} from './Logo';
import type {Locale, StoreSettings} from '@/lib/types';

export async function Header({locale, settings}: {locale: Locale; settings: StoreSettings}) {
  const t = await getTranslations();
  const homeHref = locale === 'ar' ? '/ar' : '/en';

  return (
    <header className="sticky top-0 z-40 border-b border-[#ececec] bg-white/95 text-[#111111] shadow-[0_1px_12px_rgba(17,17,17,0.04)] backdrop-blur-xl">
      <div
        aria-label="💖 خلك على المضمون… واطلب من سڤن فون | 🚚 توصيل سريع لجميع مناطق البحرين"
        className="announcement-bar overflow-hidden bg-brand-pink py-1.5 text-center text-xs font-bold text-white"
        dir="ltr"
      >
        <div className="announcement-track">
          <span className="announcement-item" dir="rtl">
            💖 خلك على المضمون… واطلب من سڤن فون | 🚚 توصيل سريع لجميع مناطق البحرين
          </span>
          <span aria-hidden="true" className="announcement-item" dir="rtl">
            💖 خلك على المضمون… واطلب من سڤن فون | 🚚 توصيل سريع لجميع مناطق البحرين
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a href={homeHref} aria-label="7phone home" className="shrink-0">
            <Logo logoUrl={settings.logoUrl} />
          </a>
          <a
            href={homeHref}
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#ececec] bg-[#f7f7f8] px-4 text-sm font-bold text-[#111111] transition hover:border-brand-neon hover:bg-white"
          >
            <svg aria-hidden="true" className="h-4 w-4 text-brand-neon" fill="none" viewBox="0 0 24 24">
              <path d="M4 11.5 12 5l8 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M6.5 10.5V19h11v-8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M10 19v-5h4v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </a>
        </div>
        <nav className="flex items-center gap-2">
          <a
            href={settings.mapsUrl}
            className="hidden h-10 items-center rounded-full border border-[#ececec] px-4 text-xs font-bold text-[#666666] transition hover:border-brand-neon hover:text-[#111111] md:inline-flex"
          >
            {t('location')}
          </a>
          <a
            href={`tel:${settings.phoneSales}`}
            className="inline-flex h-10 items-center rounded-full bg-brand-neon px-4 text-xs font-black text-white transition hover:brightness-105"
          >
            {t('call')}
          </a>
          <LanguageSwitchLink locale={locale} />
        </nav>
      </div>
    </header>
  );
}
