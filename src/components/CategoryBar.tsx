'use client';

import {useRef, useState} from 'react';
import type {Category, Locale} from '@/lib/types';

type IconKind = 'phones' | 'tablets' | 'watches' | 'earbuds' | 'accessories' | 'computers';

function CategoryIcon({kind}: {kind: IconKind}) {
  const line = {fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.4, vectorEffect: 'non-scaling-stroke' as const};
  const accentClass = 'stroke-brand-neon opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-aria-[pressed=true]:opacity-100';
  const iconClass = 'h-12 w-12 text-[#202124] md:h-[52px] md:w-[52px]';

  if (kind === 'phones') return <svg aria-hidden className={iconClass} viewBox="0 0 24 24"><rect {...line} x="7.25" y="2.5" width="9.5" height="19" rx="2.25"/><path {...line} d="M10.35 5h3.3M10.75 18.9h2.5"/><path {...line} className={accentClass} d="M16.75 8.25v4"/></svg>;
  if (kind === 'tablets') return <svg aria-hidden className={iconClass} viewBox="0 0 24 24"><rect {...line} x="4" y="3" width="16" height="18" rx="2.25"/><path {...line} d="M12 18.25h.01"/><path {...line} className={accentClass} d="M20 8v4"/></svg>;
  if (kind === 'watches') return <svg aria-hidden className={iconClass} viewBox="0 0 24 24"><path {...line} d="M9 6.5 9.75 2.5h4.5L15 6.5M9 17.5l.75 4h4.5l.75-4"/><rect {...line} x="6.5" y="6.5" width="11" height="11" rx="3"/><path {...line} d="M12 9.25v3l2 1.2"/><path {...line} className={accentClass} d="M17.5 10v4"/></svg>;
  if (kind === 'earbuds') return <svg aria-hidden className={iconClass} viewBox="0 0 24 24"><path {...line} d="M8.5 3.5A3.5 3.5 0 0 0 5 7v3.5a2.5 2.5 0 0 0 2.5 2.5h1V8.5M15.5 3.5A3.5 3.5 0 0 1 19 7v3.5a2.5 2.5 0 0 1-2.5 2.5h-1V8.5M8.5 13v6.5M15.5 13v6.5"/><path {...line} d="M6.75 21h3.5M13.75 21h3.5"/><path {...line} className={accentClass} d="M19 7.5v3"/></svg>;
  if (kind === 'accessories') return <svg aria-hidden className={iconClass} viewBox="0 0 24 24"><rect {...line} x="5" y="7" width="10" height="11" rx="2"/><path {...line} d="M8 7V3.5M12 7V3.5M10 18v3M17.5 9.5h1.5v5h-1.5M8.25 12.5h3.5"/><path {...line} className={accentClass} d="M15 10v5"/></svg>;
  return <svg aria-hidden className={iconClass} viewBox="0 0 24 24"><rect {...line} x="3.25" y="5" width="11" height="14" rx="2"/><rect {...line} x="16.75" y="7.5" width="4" height="9" rx="1.25"/><path {...line} d="M6.25 8h5M6.25 11h5M6.25 14h2.25"/><circle {...line} cx="11.5" cy="16" r=".75"/><path {...line} className={accentClass} d="M16.75 10.25h4"/></svg>;
}

const groups: Array<{kind: IconKind; ar: string; en: string; match: RegExp}> = [
  {kind: 'phones', ar: 'هواتف', en: 'Phones', match: /phone|mobile|هاتف/i},
  {kind: 'tablets', ar: 'تابلت', en: 'Tablets', match: /tablet|ipad|تابلت/i},
  {kind: 'watches', ar: 'ساعات ذكية', en: 'Smart Watches', match: /watch|ساعة/i},
  {kind: 'earbuds', ar: 'سماعات', en: 'Earbuds', match: /earbud|audio|headphone|سماع/i},
  {kind: 'accessories', ar: 'إكسسوارات', en: 'Accessories', match: /accessor|cover|case|charger|power|cable|إكسسوار/i},
  {kind: 'computers', ar: 'إلكترونيات', en: 'Electronics', match: /electronic|computer|laptop|macbook|إلكترونيات|كمبيوتر/i}
];

export function CategoryBar({categories, activeCategory, onSelect, locale, title}: {categories: Category[]; activeCategory: string; onSelect: (slug: string) => void; locale: Locale; allLabel: string; title?: string}) {
  const [page, setPage] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const visible = [...categories].filter((category) => category.slug && category.is_visible !== false && category.is_active !== false).sort((a, b) => (a.display_order ?? a.sort_order ?? 0) - (b.display_order ?? b.sort_order ?? 0));
  const items = groups.map((group) => ({...group, category: visible.find((item) => group.match.test(`${item.slug} ${item.name_en} ${item.name_ar}`))}));
  const activate = (category: Category) => { if (category.homepage_url) window.location.assign(category.homepage_url); else onSelect(category.slug); };
  const scrollTo = (index: number) => { const element = rail.current?.children[index] as HTMLElement | undefined; element?.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'}); setPage(index); };

  return <section aria-label={locale === 'ar' ? 'تسوق حسب الفئة' : 'Shop by Category'} className="bg-white px-4 py-12 text-[#111]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <div className="mx-auto max-w-7xl">
      <h2 className="text-center text-2xl font-black tracking-tight md:text-3xl">{title || (locale === 'ar' ? 'تسوق حسب الفئة' : 'Shop by Category')}</h2>
      <div ref={rail} onScroll={(event) => { const node = event.currentTarget; const width = node.firstElementChild?.getBoundingClientRect().width || 1; setPage(Math.max(0, Math.min(items.length - 1, Math.round(Math.abs(node.scrollLeft) / (width + 12))))); }} className="hide-scrollbar mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible">
        {items.map(({kind, ar, en, category}) => { const slug = category?.slug || kind; const active = activeCategory === slug; return <button aria-pressed={active} className={`group flex min-w-[142px] snap-center flex-col items-center rounded-[20px] border bg-white px-3 py-5 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon md:min-w-0 ${active ? 'border-brand-neon' : 'border-[#ececec] hover:border-brand-neon/50'}`} key={kind} onClick={() => category ? activate(category) : onSelect(slug)} type="button">
          <span className={`grid h-[92px] w-[92px] place-items-center rounded-full border transition duration-200 md:h-[108px] md:w-[108px] ${active ? 'border-brand-neon/35 bg-brand-neon/[.07] text-black' : 'border-[#f0e8ed] bg-[#faf6f8] text-black group-hover:bg-brand-neon/[.05]'}`}><CategoryIcon kind={kind}/></span>
          <strong className="mt-4 min-h-6 text-sm font-black md:text-base">{locale === 'ar' ? ar : en}</strong>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-brand-neon">{locale === 'ar' ? 'تسوق الآن' : 'Shop Now'} <span aria-hidden>{locale === 'ar' ? '←' : '→'}</span></span>
        </button>; })}
      </div>
      {items.length > 1 ? <div className="mt-4 flex justify-center gap-2 md:hidden" aria-label={locale === 'ar' ? 'صفحات الفئات' : 'Category pages'}>{items.map((item, index) => <button aria-label={`${index + 1}`} className={`h-2 rounded-full transition-all ${page === index ? 'w-6 bg-brand-neon' : 'w-2 bg-zinc-300'}`} key={item.kind} onClick={() => scrollTo(index)} type="button" />)}</div> : null}
    </div>
  </section>;
}
