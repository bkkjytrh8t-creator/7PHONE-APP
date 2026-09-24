'use client';

import {usePathname} from 'next/navigation';
import type {Locale} from '@/lib/types';

function switchedPath(pathname: string | null, nextLocale: Locale) {
  if (!pathname) {
    return `/${nextLocale}`;
  }

  const match = pathname.match(/^\/(ar|en)(\/.*)?$/);
  if (!match) {
    return `/${nextLocale}`;
  }

  const route = match[2] ?? '';
  if (!route || route === '/') {
    return `/${nextLocale}`;
  }

  if (/^\/product\/[^/]+$/.test(route)) {
    return `/${nextLocale}${route}`;
  }

  if (/^\/admin(\/.*)?$/.test(route)) {
    return `/${nextLocale}${route}`;
  }

  return `/${nextLocale}`;
}

export function LanguageSwitchLink({locale}: {locale: Locale}) {
  const pathname = usePathname();
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  const href = switchedPath(pathname, nextLocale);

  return (
    <a
      href={href}
      className="inline-flex h-10 items-center rounded-full border border-brand-neon/70 px-4 text-xs font-black text-brand-neon transition hover:bg-brand-neon hover:text-white"
    >
      {nextLocale.toUpperCase()}
    </a>
  );
}
