'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

export function HtmlLocaleSync() {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'ar';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return null;
}
