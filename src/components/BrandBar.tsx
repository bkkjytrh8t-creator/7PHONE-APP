'use client';

import {useRef, useState} from 'react';
import type {Brand, Locale} from '@/lib/types';
import {FallbackImage} from './FallbackImage';

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export function BrandBar({brands, activeBrand, onSelect, locale, allLabel, title}: {brands: Brand[]; activeBrand: string; onSelect: (name: string) => void; locale: Locale; allLabel: string; title?: string}) {
  const [page, setPage] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const ordered = [...brands]
    .filter((brand) => brand.is_visible !== false && normalized(brand.name_en))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .filter((brand, index, list) => list.findIndex((item) => normalized(item.name_en) === normalized(brand.name_en)) === index);
  const activate = (brand: Brand) => { if (brand.homepage_url) window.location.assign(brand.homepage_url); else onSelect(brand.name_en); };
  const scrollTo = (index: number) => { const item = rail.current?.children[index] as HTMLElement | undefined; item?.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'}); setPage(index); };

  const card = (brand: Brand, mobile = false) => {
    const active = normalized(activeBrand) === normalized(brand.name_en);
    return <button aria-pressed={active} className={`group flex ${mobile ? 'min-w-[150px] snap-center' : ''} flex-col items-center rounded-[20px] border bg-white px-4 py-5 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${active ? 'border-brand-neon' : 'border-[#ececec] shadow-[0_4px_16px_rgba(0,0,0,.035)] hover:border-brand-neon/45'}`} key={`${mobile ? 'mobile' : 'desktop'}-${brand.id}`} onClick={() => activate(brand)} type="button">
      <span className="grid h-[82px] w-full place-items-center rounded-2xl bg-[#fafafa] p-3"><FallbackImage alt={`${brand.name_en} logo`} className="max-h-12 max-w-[112px] object-contain" src={brand.logo_url}><span className="text-xl font-black tracking-tight text-zinc-800">{brand.name_en}</span></FallbackImage></span>
      <strong className="mt-3 max-w-full truncate text-sm font-black text-zinc-900">{locale === 'ar' ? brand.name_ar || brand.name_en : brand.name_en}</strong>
      <span className={`mt-2 h-1 w-5 rounded-full transition ${active ? 'bg-brand-neon' : 'bg-zinc-200 group-hover:bg-brand-neon/50'}`} />
    </button>;
  };

  return <section className="bg-white px-4 py-12 text-[#111]" dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-label={locale === 'ar' ? 'الماركات' : 'Brands'}>
    <div className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-brand-neon">7PHONE</p><h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{title || (locale === 'ar' ? 'الماركات' : 'Brands')}</h2></div>{activeBrand !== 'all' ? <button className="text-xs font-black text-zinc-500 hover:text-brand-neon" onClick={() => onSelect('all')} type="button">{allLabel}</button> : null}</div>
      <div className="mt-7 hidden grid-cols-4 gap-4 md:grid lg:grid-cols-8">{ordered.map((brand) => card(brand))}</div>
      <div ref={rail} onScroll={(event) => { const node = event.currentTarget; const width = node.firstElementChild?.getBoundingClientRect().width || 1; setPage(Math.max(0, Math.min(ordered.length - 1, Math.round(Math.abs(node.scrollLeft) / (width + 12))))); }} className="hide-scrollbar mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth md:hidden">{ordered.map((brand) => card(brand, true))}</div>
      {ordered.length > 1 ? <div className="mt-4 flex justify-center gap-2 md:hidden">{ordered.map((brand, index) => <button aria-label={`${locale === 'ar' ? 'ماركة' : 'Brand'} ${index + 1}`} className={`h-2 rounded-full transition-all ${page === index ? 'w-6 bg-brand-neon' : 'w-2 bg-zinc-300'}`} key={brand.id} onClick={() => scrollTo(index)} type="button" />)}</div> : null}
    </div>
  </section>;
}
