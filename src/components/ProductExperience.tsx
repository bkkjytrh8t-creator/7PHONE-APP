'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {formatPrice, localizedProductList, productName} from '@/lib/format';
import {productImagesForColor} from '@/lib/productNormalize';
import type {Locale, Product, ProductMedia, ProductVariant} from '@/lib/types';
import {mediaPlatformLabel, videoEmbedUrl} from '@/lib/productMedia';
import {productVariants, uniqueVariantValues, variantAvailable, variantColor, variantImages, variantKey, variantPrice} from '@/lib/variants';
import {FallbackImage} from './FallbackImage';
import {ProductLikeButton} from './ProductLikeButton';

type Props = {
  product: Product;
  locale: Locale;
  selectedVariant?: ProductVariant | null;
  onVariantChange?: (variant: ProductVariant) => void;
};

export function ProductExperience({product, locale, selectedVariant, onVariantChange}: Props) {
  const variants = useMemo(() => productVariants(product), [product]);
  const availableVariants = useMemo(() => variants.filter(variantAvailable), [variants]);
  const hasVariants = variants.length > 0;
  const legacyColors = localizedProductList(product, 'colors', locale);
  const legacyColorOptions = product.color_options?.length ? product.color_options : legacyColors.map((name) => ({name, hex: '#d4d4d8'}));
  const legacyStorage = localizedProductList(product, 'storage', locale);
  const [legacyColor, setLegacyColor] = useState('');
  const [legacyCapacity, setLegacyCapacity] = useState(product.storage_prices[0]?.label ?? legacyStorage[0] ?? '');
  const activeColor = selectedVariant ? variantColor(selectedVariant, locale) : legacyColor;
  const images = useMemo(() => {
    const exact = variantImages(product, selectedVariant);
    return exact.length ? exact : productImagesForColor(product, activeColor);
  }, [activeColor, product, selectedVariant]);
  const media = useMemo<ProductMedia[]>(() => {
    const videos = (product.media_gallery ?? []).filter((item) => item.media_type === 'video');
    const exactVariantImages = variantImages(product, selectedVariant);
    if (exactVariantImages.length) {
      return [
        ...exactVariantImages.map((url, index) => ({id: `variant-image-${index}`, media_type: 'image' as const, source_type: 'external_url' as const, url, thumbnail_url: url, sort_order: index, is_primary: index === 0})),
        ...videos.map((item, index) => ({...item, sort_order: exactVariantImages.length + index}))
      ];
    }
    const stored = product.media_gallery ?? [];
    if (stored.length) {
      const matchingColorImages = activeColor ? stored.filter((item) => item.media_type === 'image' && item.color?.trim().toLowerCase() === activeColor.trim().toLowerCase()) : [];
      return matchingColorImages.length
        ? stored.filter((item) => item.media_type === 'video' || matchingColorImages.includes(item)).map((item, index) => ({...item, sort_order: index}))
        : stored;
    }
    return images.map((url, index) => ({id: `image-${index}`, media_type: 'image', source_type: 'external_url', url, thumbnail_url: url, sort_order: index, is_primary: index === 0}));
  }, [activeColor, images, product.media_gallery, product, selectedVariant]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const touchStart = useRef<number | null>(null);
  const dragStart = useRef<{x: number; y: number; panX: number; panY: number} | null>(null);
  const pinchStart = useRef<{distance: number; zoom: number} | null>(null);
  const activeMedia = media[activeImageIndex] ?? media[0];
  const activeImage = activeMedia?.media_type === 'image' ? activeMedia.url : '';
  const selectedLegacyStorage = product.storage_prices.find((item) => item.label === legacyCapacity);
  const displayPrice = hasVariants ? variantPrice(product, selectedVariant) : selectedLegacyStorage?.price_bhd ?? product.price_bhd;
  const colorOptions = Array.from(new Map(variants.map((variant) => [variant.color_en || variant.color || variant.color_ar || '', variant])).values()).filter((variant) => variantColor(variant, locale));
  const storageOptions = uniqueVariantValues(variants, 'storage');
  const ramOptions = uniqueVariantValues(variants, 'ram');

  useEffect(() => {
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  }, [media]);

  useEffect(() => {
    setImageLoaded(false);
  }, [activeMedia?.id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') moveMedia(locale === 'ar' ? 1 : -1, true);
      if (event.key === 'ArrowRight') moveMedia(locale === 'ar' ? -1 : 1, true);
      if (event.key === '+' || event.key === '=') setZoom((value) => Math.min(4, value + 0.25));
      if (event.key === '-') setZoom((value) => Math.max(1, value - 0.25));
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isLightboxOpen, locale, activeImageIndex, media.length]);

  function selectMedia(index: number) {
    setActiveImageIndex(index);
    setIsLightboxOpen(false);
  }

  function moveMedia(direction: number, keepLightbox = false) {
    if (!media.length) return;
    const nextIndex = (activeImageIndex + direction + media.length) % media.length;
    setActiveImageIndex(nextIndex);
    if (!keepLightbox || media[nextIndex]?.media_type === 'video') setIsLightboxOpen(false);
    setZoom(1);
    setPan({x: 0, y: 0});
  }

  function openLightbox() {
    setZoom(1);
    setPan({x: 0, y: 0});
    setIsLightboxOpen(true);
  }

  function changeZoom(next: number) {
    const value = Math.min(4, Math.max(1, next));
    setZoom(value);
    if (value === 1) setPan({x: 0, y: 0});
  }

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y};
  }

  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setPan({
      x: dragStart.current.panX + event.clientX - dragStart.current.x,
      y: dragStart.current.panY + event.clientY - dragStart.current.y
    });
  }

  function choose(field: 'color' | 'storage' | 'ram', value: string) {
    const compatible = availableVariants.filter((variant) => {
      if (field === 'color') return (variant.color_en || variant.color || variant.color_ar) === value;
      return variant[field] === value;
    });
    const exact = compatible.find((variant) =>
      (field === 'color' || variantColor(variant, locale) === variantColor(selectedVariant ?? {}, locale))
      && (field === 'storage' || variant.storage === selectedVariant?.storage)
      && (field === 'ram' || variant.ram === selectedVariant?.ram)
    );
    if (exact ?? compatible[0]) onVariantChange?.(exact ?? compatible[0]);
  }

  function optionAvailable(field: 'color' | 'storage' | 'ram', value: string) {
    return availableVariants.some((variant) => {
      if (field === 'color') return (variant.color_en || variant.color || variant.color_ar) === value;
      return variant[field] === value;
    });
  }

  return (
    <section className="grid min-w-0 w-full max-w-full gap-4 rounded-[24px] border border-[#ececec] bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,.05)] md:p-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-brand-neon">{locale === 'ar' ? 'معرض الوسائط' : 'Media gallery'}</p>
          <p className="mt-1 text-xs font-bold text-zinc-400">{media.length ? `${activeImageIndex + 1} / ${media.length}` : locale === 'ar' ? 'لا توجد وسائط' : 'No media'}</p>
        </div>
        {activeMedia?.media_type === 'image' ? <span className="rounded-full border border-brand-neon/25 bg-brand-neon/5 px-3 py-1 text-[11px] font-black text-brand-neon">{locale === 'ar' ? 'اضغط للتكبير' : 'Click to zoom'}</span> : null}
      </div>

      <div className="relative isolate h-[360px] overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_12px_36px_rgba(0,0,0,.06)] sm:h-[500px] lg:h-[620px]" onTouchStart={(event) => {if (event.touches.length === 1) touchStart.current = event.touches[0]?.clientX ?? null;}} onTouchEnd={(event) => {if (touchStart.current === null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(delta) > 45) moveMedia(delta > 0 ? -1 : 1); touchStart.current = null;}}>
        <ProductLikeButton productId={product.id} initialLikes={product.likes} label={locale === 'ar' ? 'إعجاب بالمنتج' : 'Like product'} />
        <div className="h-full w-full transition-opacity duration-300" key={activeMedia?.id}>
          {activeMedia?.media_type === 'video' ? <VideoPlayer media={activeMedia} title={productName(product, locale)} locale={locale} /> : <button aria-label={locale === 'ar' ? 'فتح الصورة بحجم كامل' : 'Open image fullscreen'} className="relative grid h-full w-full place-items-center bg-white p-5 outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-neon md:p-8" onClick={openLightbox} onDoubleClick={openLightbox} type="button">
            {!imageLoaded ? <span aria-hidden className="absolute inset-5 animate-pulse rounded-xl bg-zinc-100 md:inset-8" /> : null}
            <FallbackImage alt={productName(product, locale)} className={`relative z-10 block h-full w-full max-w-full object-contain object-center transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} loading={activeImageIndex === 0 ? 'eager' : 'lazy'} onLoad={() => setImageLoaded(true)} src={activeImage}><div className="grid h-full w-full place-items-center rounded-xl bg-zinc-100 text-5xl text-brand-neon">7P</div></FallbackImage>
          </button>}
        </div>
        {media.length > 1 ? <>
          <button aria-label={locale === 'ar' ? 'الوسائط السابقة' : 'Previous media'} className="absolute start-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white/95 text-xl font-black text-zinc-800 shadow-lg transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-neon sm:grid" onClick={() => moveMedia(-1)} type="button">{locale === 'ar' ? '›' : '‹'}</button>
          <button aria-label={locale === 'ar' ? 'الوسائط التالية' : 'Next media'} className="absolute end-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white/95 text-xl font-black text-zinc-800 shadow-lg transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-neon sm:grid" onClick={() => moveMedia(1)} type="button">{locale === 'ar' ? '‹' : '›'}</button>
        </> : null}
      </div>

      {media.length > 1 ? <div aria-label={locale === 'ar' ? 'صور وفيديوهات المنتج' : 'Product images and videos'} className="hide-scrollbar flex max-w-full gap-2 overflow-x-auto px-1 py-1" role="tablist">{media.map((item, index) => <button aria-label={item.media_type === 'video' ? `${locale === 'ar' ? 'تشغيل فيديو' : 'Play video'} ${mediaPlatformLabel(item.source_type)}` : `${locale === 'ar' ? 'عرض الصورة' : 'View image'} ${index + 1}`} aria-pressed={activeImageIndex === index} className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border bg-white p-1.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${activeImageIndex === index ? 'border-brand-neon ring-2 ring-brand-neon/15' : 'border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md'}`} key={item.id} onClick={() => selectMedia(index)} role="tab" type="button"><FallbackImage alt={item.media_type === 'image' ? productName(product, locale) : ''} className="h-full w-full rounded-lg object-contain" loading="lazy" src={item.thumbnail_url || item.url}><div className="grid h-full place-items-center rounded-lg bg-zinc-100 text-lg text-zinc-700">{item.media_type === 'video' ? '▶' : '7P'}</div></FallbackImage>{item.media_type === 'video' ? <><span className="absolute inset-0 grid place-items-center"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-neon text-sm text-white shadow-md">▶</span></span><span className="absolute bottom-1 end-1 rounded bg-black/75 px-1 py-0.5 text-[7px] font-black tracking-wide text-white">VIDEO</span></> : null}</button>)}</div> : null}

      {isLightboxOpen && activeMedia?.media_type === 'image' ? <div aria-label={locale === 'ar' ? 'عارض الصورة بالحجم الكامل' : 'Fullscreen image viewer'} aria-modal="true" className="fixed inset-0 z-[110] bg-black/95" role="dialog">
        <div className="absolute start-4 top-4 z-20 flex gap-2"><button aria-label={locale === 'ar' ? 'تصغير' : 'Zoom out'} className="grid h-11 w-11 place-items-center rounded-full bg-white/12 text-xl text-white focus-visible:ring-2 focus-visible:ring-brand-neon" onClick={() => changeZoom(zoom - .25)} type="button">−</button><button aria-label={locale === 'ar' ? 'تكبير' : 'Zoom in'} className="grid h-11 w-11 place-items-center rounded-full bg-white/12 text-xl text-white focus-visible:ring-2 focus-visible:ring-brand-neon" onClick={() => changeZoom(zoom + .25)} type="button">+</button><span className="grid h-11 min-w-14 place-items-center rounded-full bg-white/12 px-3 text-xs font-black text-white">{Math.round(zoom * 100)}%</span></div>
        <button aria-label={locale === 'ar' ? 'إغلاق' : 'Close'} className="absolute end-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/12 text-2xl text-white focus-visible:ring-2 focus-visible:ring-brand-neon" onClick={() => setIsLightboxOpen(false)} type="button">×</button>
        <div className={`grid h-full w-full touch-none place-items-center overflow-hidden p-4 pt-20 ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`} onDoubleClick={() => changeZoom(zoom > 1 ? 1 : 2)} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={() => {dragStart.current = null;}} onTouchStart={(event) => {if (event.touches.length === 2) {const [a, b] = [event.touches[0], event.touches[1]]; pinchStart.current = {distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom};}}} onTouchMove={(event) => {if (event.touches.length === 2 && pinchStart.current) {const [a, b] = [event.touches[0], event.touches[1]]; const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); changeZoom(pinchStart.current.zoom * distance / pinchStart.current.distance);}}} onTouchEnd={() => {pinchStart.current = null;}} onWheel={(event) => {event.preventDefault(); changeZoom(zoom + (event.deltaY < 0 ? .25 : -.25));}}>
          <FallbackImage alt={productName(product, locale)} className="max-h-full max-w-full select-none object-contain will-change-transform" loading="eager" src={activeImage}><div /></FallbackImage>
          <style jsx>{`div :global(img) { transform: translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}); transition: ${dragStart.current ? 'none' : 'transform 180ms ease'}; }`}</style>
        </div>
        {media.length > 1 ? <><button aria-label={locale === 'ar' ? 'الوسائط السابقة' : 'Previous media'} className="absolute start-4 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-2xl text-white" onClick={() => moveMedia(-1, true)} type="button">{locale === 'ar' ? '›' : '‹'}</button><button aria-label={locale === 'ar' ? 'الوسائط التالية' : 'Next media'} className="absolute end-4 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-2xl text-white" onClick={() => moveMedia(1, true)} type="button">{locale === 'ar' ? '‹' : '›'}</button></> : null}
      </div> : null}

      <div className="grid gap-4 rounded-2xl border border-[#ececec] bg-[#f7f7f8] p-4 text-[#111]">
        {hasVariants ? <>
          {colorOptions.length ? <OptionGroup label={locale === 'ar' ? 'اللون' : 'Color'}>{colorOptions.map((option) => {
            const value = option.color_en || option.color || option.color_ar || '';
            const active = Boolean(selectedVariant && (selectedVariant.color_en || selectedVariant.color || selectedVariant.color_ar) === value);
            const enabled = optionAvailable('color', value);
            return <button aria-pressed={active} className={`relative flex min-h-12 items-center gap-2 rounded-full border px-3 text-xs font-black ${active ? 'border-brand-neon bg-white text-black ring-2 ring-brand-neon/20' : enabled ? 'border-zinc-200 bg-white text-zinc-800' : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 line-through'}`} disabled={!enabled} key={value} onClick={() => choose('color', value)} type="button"><span className="h-6 w-6 rounded-full border border-black/15" style={{backgroundColor: option.color_hex || '#d4d4d8'}} />{variantColor(option, locale)}{active ? <span>✓</span> : null}</button>;
          })}</OptionGroup> : null}
          {storageOptions.length ? <OptionGroup label={locale === 'ar' ? 'السعة التخزينية' : 'Storage'}>{storageOptions.map((value) => <VariantButton active={selectedVariant?.storage === value} disabled={!optionAvailable('storage', value)} key={value} label={value} popular={variants.some((variant) => variant.storage === value && variant.most_popular)} onClick={() => choose('storage', value)} locale={locale} />)}</OptionGroup> : null}
          {ramOptions.length > 1 ? <OptionGroup label={locale === 'ar' ? 'الذاكرة (RAM)' : 'RAM'}>{ramOptions.map((value) => <VariantButton active={selectedVariant?.ram === value} disabled={!optionAvailable('ram', value)} key={value} label={value} onClick={() => choose('ram', value)} locale={locale} />)}</OptionGroup> : null}
          <div className="grid gap-2 rounded-xl bg-white px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="font-black text-zinc-950">{locale === 'ar' ? 'الإصدار المحدد' : 'Selected Version'}</p><p className="mt-1 text-zinc-600">{[variantColor(selectedVariant ?? {}, locale), selectedVariant?.storage, selectedVariant?.ram].filter(Boolean).join(' / ')}</p>{selectedVariant?.sku ? <p className="mt-1 text-xs text-zinc-400">SKU: {selectedVariant.sku}</p> : null}</div>
            <div className="text-start sm:text-end"><strong className="text-xl text-brand-neon">{formatPrice(displayPrice, locale)}</strong><p className={`text-xs font-black ${selectedVariant && variantAvailable(selectedVariant) ? 'text-emerald-400' : 'text-red-400'}`}>{selectedVariant && variantAvailable(selectedVariant) ? locale === 'ar' ? `متوفر${selectedVariant.stock != null ? ` (${selectedVariant.stock})` : ''}` : `In stock${selectedVariant.stock != null ? ` (${selectedVariant.stock})` : ''}` : locale === 'ar' ? 'غير متوفر' : 'Out of stock'}</p></div>
          </div>
        </> : <>
          {product.storage_prices.length ? <OptionGroup label={locale === 'ar' ? 'اختر السعة' : 'Choose storage'}>{product.storage_prices.map((item) => <VariantButton active={legacyCapacity === item.label} key={item.label} label={item.label} onClick={() => {setLegacyCapacity(item.label); onVariantChange?.({...selectedVariant, storage: item.label, price_bhd: item.price_bhd});}} locale={locale} />)}</OptionGroup> : null}
          {legacyColorOptions.length ? <OptionGroup label={locale === 'ar' ? 'اختر اللون' : 'Choose color'}>{legacyColorOptions.map((option) => { const active = legacyColor === option.name; return <button aria-pressed={active} className={`relative grid min-h-14 min-w-16 place-items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black ${active ? 'border-brand-neon bg-white text-zinc-950 ring-2 ring-brand-neon/20' : 'border-zinc-200 bg-white text-zinc-700'}`} key={option.name} onClick={() => {setLegacyColor(option.name); onVariantChange?.({...selectedVariant, color: option.name, color_hex: option.hex, storage: legacyCapacity, price_bhd: selectedLegacyStorage?.price_bhd ?? product.price_bhd});}} type="button"><span className="relative h-8 w-8 rounded-full border border-black/15" style={{backgroundColor: option.hex}}>{active ? <span className="absolute inset-0 grid place-items-center text-sm text-white [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">✓</span> : null}</span><span>{option.name}</span></button>;})}</OptionGroup> : null}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"><span className="text-sm font-black text-zinc-950">{legacyCapacity} {legacyColor ? `/ ${legacyColor}` : ''}</span><strong className="text-xl text-brand-neon">{formatPrice(displayPrice, locale)}</strong></div>
        </>}
      </div>
    </section>
  );
}

function VideoPlayer({media, title, locale}: {media: ProductMedia; title: string; locale: Locale}) {
  const embed = videoEmbedUrl(media);
  const watchLabel = locale === 'ar' ? 'مشاهدة الفيديو' : 'Watch video';
  if (!embed) return <div className="grid h-full place-items-center bg-white p-6"><a className="font-black text-brand-neon" href={media.url} rel="noopener noreferrer" target="_blank">{watchLabel} ↗</a></div>;
  if (media.source_type === 'mp4' || media.source_type === 'webm') return <div className="grid h-full w-full place-items-center bg-white p-3"><video className="aspect-video max-h-full max-w-full rounded-xl bg-black object-contain" controls controlsList="nodownload" playsInline preload="metadata" src={embed} /></div>;
  const playerUrl = new URL(embed);
  playerUrl.searchParams.delete('autoplay');
  playerUrl.searchParams.delete('mute');
  playerUrl.searchParams.set('controls', '1');
  playerUrl.searchParams.set('playsinline', '1');
  return <div className="grid h-full w-full place-items-center gap-2 bg-white p-3"><iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="aspect-video max-h-[calc(100%-36px)] w-full rounded-xl border-0 bg-black" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" src={playerUrl.toString()} title={`${title} — ${mediaPlatformLabel(media.source_type)}`} /><a className="text-sm font-black text-brand-neon" href={media.url} rel="noopener noreferrer" target="_blank">{watchLabel} ↗</a></div>;
}

function OptionGroup({label, children}: {label: string; children: React.ReactNode}) {
  return <div><p className="text-xs font-black uppercase text-zinc-500">{label}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div></div>;
}

function VariantButton({label, active, disabled = false, popular = false, locale, onClick}: {label: string; active: boolean; disabled?: boolean; popular?: boolean; locale: Locale; onClick: () => void}) {
  return <button aria-pressed={active} className={`relative min-h-12 rounded-xl border px-4 text-xs font-black ${active ? 'border-brand-neon bg-brand-neon text-white' : disabled ? 'cursor-not-allowed border-zinc-100 text-zinc-300 line-through' : 'border-zinc-200 bg-white text-zinc-800'}`} disabled={disabled} onClick={onClick} type="button">{popular ? <span className="absolute -top-2 end-1 rounded-full bg-white px-2 py-0.5 text-[9px] text-brand-neon">{locale === 'ar' ? 'الأكثر طلبًا' : 'Most popular'}</span> : null}{label}</button>;
}
