'use client';

import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {brandName, categoryName, formatPrice, productName} from '@/lib/format';
import {primaryProductImage, productRouteKey} from '@/lib/productNormalize';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {FallbackImage} from './FallbackImage';
import {WhatsAppButton} from './WhatsAppButton';

export function ProductQuickViewButton({
  product,
  locale,
  settings,
  label,
  orderLabel
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
  label: string;
  orderLabel: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const name = productName(product, locale);
  const image = primaryProductImage(product);
  const productHref = `/${locale}/product/${productRouteKey(product)}`;
  const specs = locale === 'ar' ? product.specifications_ar : product.specifications_en;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/75 px-4 py-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-4xl items-center">
        <section className="grid w-full gap-4 rounded-2xl border border-white/10 bg-[#08080a] p-4 text-white shadow-neon md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-[#111115] p-3">
            <FallbackImage alt={name} className="h-full w-full rounded-xl object-cover" src={image}>
              <div className="grid h-full w-full place-items-center rounded-xl bg-black text-center text-sm font-black text-white">
                7Phone
              </div>
            </FallbackImage>
          </div>
          <div className="grid content-start gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-brand-neon">{brandName(product, locale)} · {categoryName(product, locale)}</p>
                <h2 className="mt-2 text-2xl font-black">{name}</h2>
              </div>
              <button
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-lg font-black"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-2xl font-black text-brand-neon">{formatPrice(product.price_bhd, locale)}</strong>
              {product.old_price_bhd ? (
                <span className="text-sm font-semibold text-zinc-400 line-through">{formatPrice(product.old_price_bhd, locale)}</span>
              ) : null}
            </div>
            <p className="text-sm font-black text-white/80">{product.warranty || '-'}</p>
            <p className={`text-sm font-black ${product.stock_status === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>
              {product.stock_status === 'available'
                ? locale === 'ar' ? 'متوفر الآن' : 'Available now'
                : locale === 'ar' ? 'نفذ من المخزون' : 'Out of stock'}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <span className="text-xs font-black uppercase text-white/40">{locale === 'ar' ? 'السعة' : 'Storage'}</span>
                <p className="mt-1 text-sm font-bold">{product.storage.join(' / ') || '-'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <span className="text-xs font-black uppercase text-white/40">{locale === 'ar' ? 'الألوان' : 'Colors'}</span>
                <p className="mt-1 text-sm font-bold">{product.colors.join(' / ') || '-'}</p>
              </div>
            </div>
            {specs.length ? (
              <ul className="grid gap-2">
                {specs.slice(0, 3).map((spec) => (
                  <li className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white/80" key={spec}>
                    {spec}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              {product.stock_status === 'available' ? (
                <WhatsAppButton product={product} locale={locale} settings={settings} label={orderLabel} />
              ) : (
                <Link className="grid h-10 place-items-center rounded-xl bg-white/10 text-xs font-black text-white" href={productHref}>
                  {locale === 'ar' ? 'التفاصيل' : 'Details'}
                </Link>
              )}
              <Link className="grid h-10 place-items-center rounded-xl border border-white/10 text-xs font-black text-white hover:border-brand-neon" href={productHref}>
                {locale === 'ar' ? 'صفحة المنتج' : 'Product page'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        className="grid h-10 place-items-center rounded-xl border border-white/10 text-xs font-black text-white hover:border-brand-neon"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {label}
      </button>
      {isMounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
