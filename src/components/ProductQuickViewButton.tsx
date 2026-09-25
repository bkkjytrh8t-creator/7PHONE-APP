'use client';

import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {brandName, categoryName, formatPrice, localizedProductList, localizedProductText, productName} from '@/lib/format';
import {productImageSources, productImagesForColor} from '@/lib/productNormalize';
import {productAvailabilityLabel, productIsOutOfStock} from '@/lib/stock';
import type {Locale, Product, ProductMedia, ProductVariant, StoreSettings} from '@/lib/types';
import {mediaPlatformLabel, videoEmbedUrl} from '@/lib/productMedia';
import {whatsappNotifyWhenAvailableUrl} from '@/lib/whatsapp';
import type {ReactNode} from 'react';
import {FallbackImage} from './FallbackImage';
import {WhatsAppButton} from './WhatsAppButton';
import {ProductShareButton} from './ProductShareButton';
import {defaultProductVariant, productVariants, variantAvailable, variantColor, variantImages, variantKey, variantPrice} from '@/lib/variants';

function clean(value?: string) { return value?.trim() ?? ''; }
function internalColor(variant: ProductVariant) { return clean(variant.color_en || variant.color || variant.color_ar); }
function colorSwatch(value: string, hex?: string) {
  if (hex && /^#[0-9a-f]{3,8}$/i.test(hex)) return hex;
  const colors: Record<string, string> = {black: '#161616', white: '#f8fafc', silver: '#cbd5e1', gray: '#71717a', grey: '#71717a', blue: '#2563eb', orange: '#f97316', red: '#dc2626', green: '#16a34a', pink: '#ec4899', gold: '#d4a72c', purple: '#9333ea', brown: '#854d0e'};
  const key = Object.keys(colors).find((name) => value.toLowerCase().includes(name));
  return key ? colors[key] : '#a1a1aa';
}

export function ProductQuickViewButton({
  product,
  locale,
  settings,
  label,
  orderLabel,
  children,
  className
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
  label: string;
  orderLabel: string;
  children?: ReactNode;
  className?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const name = productName(product, locale);
  const variants = productVariants(product);
  const availableVariants = variants.filter(variantAvailable);
  const storageOptions = Array.from(new Set(variants.map((variant) => clean(variant.storage)).filter(Boolean)));
  const ramOptions = Array.from(new Set(variants.map((variant) => clean(variant.ram)).filter(Boolean)));
  const colorOptions = Array.from(new Set(variants.map(internalColor).filter(Boolean)));
  const selectedVariant = availableVariants.find((variant) => clean(variant.storage) === selectedStorage && clean(variant.ram) === selectedRam && internalColor(variant) === selectedColor) ?? null;
  const colorLabel = (value: string) => variantColor(variants.find((variant) => internalColor(variant) === value) ?? {color: value}, locale);
  const variantImageList = variantImages(product, selectedVariant);
  const images = variantImageList.length ? variantImageList : selectedColor ? productImagesForColor(product, colorLabel(selectedColor)) : productImageSources(product);
  const videos = (product.media_gallery ?? []).filter((item) => item.media_type === 'video');
  const media: ProductMedia[] = [
    ...images.map((url, index) => ({id: `quick-image-${index}`, media_type: 'image' as const, source_type: 'external_url' as const, url, thumbnail_url: url, sort_order: index, is_primary: index === 0})),
    ...videos.map((item, index) => ({...item, sort_order: images.length + index}))
  ];
  const activeMedia = media[activeImageIndex] ?? media[0];
  const activeImage = activeMedia?.media_type === 'image' ? activeMedia.url : '';
  const activeVideoUrl = activeMedia?.media_type === 'video' ? videoEmbedUrl(activeMedia) : '';
  const hasMultipleImages = media.length > 1;
  const productHref = `/${locale}/product/${product.id}`;
  const specs = localizedProductList(product, 'specifications', locale);
  const warranty = localizedProductText(product, 'warranty', locale);
  const isOutOfStock = (product.variants?.length ?? 0) > 0 ? !selectedVariant || !variantAvailable(selectedVariant) : productIsOutOfStock(product);
  const displayedPrice = variantPrice(product, selectedVariant);
  const displayedOldPrice = selectedVariant?.old_price_bhd ?? product.old_price_bhd;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const initial = defaultProductVariant(product);
      setSelectedStorage(clean(initial?.storage));
      setSelectedRam(clean(initial?.ram));
      setSelectedColor(initial ? internalColor(initial) : '');
      setSelectionError('');
      setActiveImageIndex(0);
    }
  }, [isOpen, product.id]);

  function selectFrom(partial: {storage?: string; ram?: string; color?: string}) {
    const storage = partial.storage ?? selectedStorage;
    const ram = partial.ram ?? selectedRam;
    const color = partial.color ?? selectedColor;
    const exact = availableVariants.find((variant) =>
      (!storage || clean(variant.storage) === storage) &&
      (!ram || clean(variant.ram) === ram) &&
      (!color || internalColor(variant) === color)
    );
    const requested = availableVariants.find((variant) =>
      (!storage || clean(variant.storage) === storage) &&
      (partial.ram === undefined || clean(variant.ram) === partial.ram) &&
      (partial.color === undefined || internalColor(variant) === partial.color)
    );
    const fallback = exact ?? requested ?? availableVariants.find((variant) => !storage || clean(variant.storage) === storage) ?? availableVariants[0];
    if (!fallback) return;
    setSelectedStorage(clean(fallback.storage));
    setSelectedRam(clean(fallback.ram));
    setSelectedColor(internalColor(fallback));
    setSelectionError('');
    setActiveImageIndex(0);
  }

  function optionAvailable(field: 'storage' | 'ram' | 'color', value: string) {
    return availableVariants.some((variant) => {
      if (field !== 'storage' && selectedStorage && clean(variant.storage) !== selectedStorage) return false;
      if (field === 'color' && selectedRam && clean(variant.ram) !== selectedRam) return false;
      return field === 'storage' ? clean(variant.storage) === value : field === 'ram' ? clean(variant.ram) === value : internalColor(variant) === value;
    });
  }

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

  function showPreviousImage() {
    if (!media.length) return;
    setActiveImageIndex((index) => (index - 1 + media.length) % media.length);
  }

  function showNextImage() {
    if (!media.length) return;
    setActiveImageIndex((index) => (index + 1) % media.length);
  }

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
        <section className="quick-view-light grid w-full gap-5 rounded-[28px] border border-[#ececec] bg-white p-5 text-[#111111] shadow-[0_24px_80px_rgba(17,17,17,0.16)] md:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-3">
            <div className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-2xl border border-[#ececec] bg-white p-4">
              {activeMedia?.media_type === 'video' ? (
                activeVideoUrl ? activeMedia.source_type === 'mp4' || activeMedia.source_type === 'webm'
                  ? <video className="aspect-video max-h-full max-w-full rounded-xl bg-black object-contain" controls controlsList="nodownload" playsInline preload="metadata" src={activeVideoUrl} />
                  : <iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="aspect-video max-h-full w-full rounded-xl border-0 bg-black" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" src={(() => {const url = new URL(activeVideoUrl); url.searchParams.delete('autoplay'); url.searchParams.delete('mute'); url.searchParams.set('controls', '1'); url.searchParams.set('playsinline', '1'); return url.toString();})()} title={`${name} — ${mediaPlatformLabel(activeMedia.source_type)}`} />
                  : <a className="font-black text-brand-neon" href={activeMedia.url} rel="noopener noreferrer" target="_blank">{locale === 'ar' ? 'مشاهدة الفيديو' : 'Watch video'} ↗</a>
              ) : <FallbackImage alt={name} className="block h-full w-full max-w-full rounded-xl object-contain object-center" src={activeImage}>
                <div className="grid h-full min-h-[292px] w-full place-items-center rounded-xl bg-black text-center text-sm font-black text-white">
                  7Phone
                </div>
              </FallbackImage>}
              {hasMultipleImages ? (
                <>
                  <button
                    aria-label={locale === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                    className="absolute start-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/70 text-lg font-black text-white shadow-lg transition hover:border-brand-neon hover:text-brand-neon"
                    onClick={showPreviousImage}
                    type="button"
                  >
                    {locale === 'ar' ? '›' : '‹'}
                  </button>
                  <button
                    aria-label={locale === 'ar' ? 'الصورة التالية' : 'Next image'}
                    className="absolute end-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/70 text-lg font-black text-white shadow-lg transition hover:border-brand-neon hover:text-brand-neon"
                    onClick={showNextImage}
                    type="button"
                  >
                    {locale === 'ar' ? '‹' : '›'}
                  </button>
                  <div className="absolute bottom-3 end-3 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-black text-white/80">
                    {activeImageIndex + 1} / {media.length}
                  </div>
                </>
              ) : null}
            </div>
            {media.length ? (
              <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-[#ececec] bg-[#f7f7f8] p-2">
                {media.map((item, index) => (
                  <button
                    aria-label={item.media_type === 'video' ? `${locale === 'ar' ? 'تشغيل فيديو' : 'Play video'} ${mediaPlatformLabel(item.source_type)}` : locale === 'ar' ? 'تغيير صورة العرض السريع' : 'Change quick view image'}
                    aria-pressed={activeImageIndex === index}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white p-1 transition ${activeImageIndex === index ? 'border-brand-neon shadow-[0_0_18px_rgba(255,0,140,0.28)]' : 'border-zinc-200 hover:border-brand-neon/70'}`}
                    key={item.id}
                    onClick={() => setActiveImageIndex(index)}
                    type="button"
                  >
                    <FallbackImage alt="" className="h-full w-full rounded-lg object-contain object-center" src={item.thumbnail_url || item.url}>
                      <div className="grid h-full w-full place-items-center rounded-lg bg-zinc-100 text-[10px] font-black text-zinc-500">
                        {item.media_type === 'video' ? '▶' : '7P'}
                      </div>
                    </FallbackImage>
                    {item.media_type === 'video' ? <span className="absolute inset-0 grid place-items-center"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-neon text-xs text-white shadow">▶</span></span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid content-start gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-brand-neon">{brandName(product, locale)} · {categoryName(product, locale)}</p>
                <h2 className="mt-2 text-2xl font-black">{name}</h2>
              </div>
              <button
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#ececec] bg-[#f7f7f8] text-lg font-black"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-2xl font-black text-brand-neon">{formatPrice(displayedPrice, locale)}</strong>
              {displayedOldPrice && displayedOldPrice > displayedPrice ? (
                <span className="text-sm font-semibold text-zinc-400 line-through">{formatPrice(displayedOldPrice, locale)}</span>
              ) : null}
            </div>
            <p className="text-sm font-black text-[#666666]">{warranty || '-'}</p>
            <p className={`text-sm font-black ${!isOutOfStock ? 'text-emerald-400' : 'text-red-400'}`}>
              {productAvailabilityLabel(product, locale)}
            </p>
            {storageOptions.length ? <fieldset className={`grid gap-2 rounded-2xl p-1 ${selectionError === 'storage' ? 'ring-2 ring-red-500' : ''}`}>
              <legend className="mb-1 text-sm font-black">{locale === 'ar' ? 'اختر السعة' : 'Choose storage'}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {storageOptions.map((value) => { const enabled = optionAvailable('storage', value); const variant = availableVariants.find((item) => clean(item.storage) === value); return <button aria-pressed={selectedStorage === value} className={`relative min-h-14 rounded-xl border px-3 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${selectedStorage === value ? 'border-brand-neon text-brand-neon' : enabled ? 'border-zinc-200 hover:border-brand-neon' : 'cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400'}`} disabled={!enabled} key={value} onClick={() => selectFrom({storage: value})} type="button"><span>{value}</span>{variant?.price_bhd != null ? <small className="mt-0.5 block text-[10px] font-bold text-zinc-500">{formatPrice(Number(variant.price_bhd), locale)}</small> : null}{selectedStorage === value ? <span className="absolute end-1.5 top-1 text-xs">✓</span> : null}{!enabled ? <small className="block text-[9px]">{locale === 'ar' ? 'غير متوفر' : 'Unavailable'}</small> : null}</button>; })}
              </div>
            </fieldset> : null}
            {ramOptions.length ? <fieldset className={`grid gap-2 rounded-2xl p-1 ${selectionError === 'ram' ? 'ring-2 ring-red-500' : ''}`}>
              <legend className="mb-1 text-sm font-black">{locale === 'ar' ? 'اختر الذاكرة (RAM)' : 'Choose memory (RAM)'}</legend>
              <div className="grid grid-cols-3 gap-2">
                {ramOptions.map((value) => { const enabled = optionAvailable('ram', value); return <button aria-pressed={selectedRam === value} className={`relative min-h-12 rounded-xl border px-3 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${selectedRam === value ? 'border-brand-neon text-brand-neon' : enabled ? 'border-zinc-200 hover:border-brand-neon' : 'cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400'}`} disabled={!enabled} key={value} onClick={() => selectFrom({ram: value})} type="button">{value}{selectedRam === value ? <span className="absolute end-1.5 top-1 text-xs">✓</span> : null}{!enabled ? <small className="block text-[9px]">{locale === 'ar' ? 'غير متوفر' : 'Unavailable'}</small> : null}</button>; })}
              </div>
            </fieldset> : null}
            {colorOptions.length ? <fieldset className={`grid gap-2 rounded-2xl p-1 ${selectionError === 'color' ? 'ring-2 ring-red-500' : ''}`}>
              <legend className="mb-1 text-sm font-black">{locale === 'ar' ? 'اختر اللون' : 'Choose color'}</legend>
              <div className="grid grid-cols-2 gap-2">
                {colorOptions.map((value) => { const enabled = optionAvailable('color', value); const variant = variants.find((item) => internalColor(item) === value); return <button aria-pressed={selectedColor === value} className={`relative flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-start text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${selectedColor === value ? 'border-brand-neon text-brand-neon' : enabled ? 'border-zinc-200 hover:border-brand-neon' : 'cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400'}`} disabled={!enabled} key={value} onClick={() => selectFrom({color: value})} type="button"><span className="h-7 w-7 shrink-0 rounded-full border border-black/10" style={{backgroundColor: colorSwatch(value, variant?.color_hex)}} /><span className="min-w-0">{colorLabel(value)}{!enabled ? <small className="block text-[9px]">{locale === 'ar' ? 'غير متوفر' : 'Unavailable'}</small> : null}</span>{selectedColor === value ? <span className="ms-auto text-sm">✓</span> : null}</button>; })}
              </div>
            </fieldset> : null}
            {specs.length ? (
              <ul className="grid gap-2">
                {specs.slice(0, 3).map((spec) => (
                  <li className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white/80" key={spec}>
                    {spec}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="grid gap-2">
              {variants.length && !selectedVariant ? <button className="h-[46px] rounded-xl bg-brand-neon text-sm font-black text-white" onClick={() => { const missing = !selectedStorage ? 'storage' : !selectedRam && ramOptions.length ? 'ram' : 'color'; setSelectionError(missing); }} type="button">{locale === 'ar' ? (!selectedStorage ? 'اختر السعة أولاً' : !selectedRam && ramOptions.length ? 'اختر الذاكرة أولاً' : 'اختر اللون أولاً') : (!selectedStorage ? 'Choose storage first' : !selectedRam && ramOptions.length ? 'Choose RAM first' : 'Choose color first')}</button> : <WhatsAppButton cardPurchase product={product} locale={locale} settings={settings} label={orderLabel} selectedVariant={selectedVariant} />}
              <ProductShareButton product={product} locale={locale} selectedVariant={selectedVariant} />
              <a className="grid h-10 place-items-center rounded-xl border border-[#dedede] bg-white text-xs font-black text-[#111111] hover:border-brand-neon" href={productHref}>
                {locale === 'ar' ? 'صفحة المنتج' : 'Product page'}
              </a>
              {isOutOfStock ? (
                <a className="col-span-2 grid h-10 place-items-center rounded-xl bg-white/10 px-3 text-center text-xs font-black text-white" href={whatsappNotifyWhenAvailableUrl(product, locale, settings)} target="_blank" rel="noreferrer">
                  {locale === 'ar' ? 'أبلغني عند توفر المنتج' : 'Notify Me When Available'}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        aria-label={label}
        className={className ?? 'box-border grid h-[46px] min-w-0 w-full place-items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#dedede] bg-white px-2.5 text-[13px] font-black text-[#111111] transition hover:border-brand-neon hover:text-brand-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon sm:px-3 sm:text-sm'}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {children ?? label}
      </button>
      {isMounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
