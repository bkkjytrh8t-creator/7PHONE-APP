'use client';

import {useEffect, useMemo, useState} from 'react';
import {formatPrice, productName} from '@/lib/format';
import {productImageSources} from '@/lib/productNormalize';
import type {Locale, Product} from '@/lib/types';
import {FallbackImage} from './FallbackImage';
import {ProductLikeButton} from './ProductLikeButton';

export function ProductExperience({product, locale}: {product: Product; locale: Locale}) {
  const images = useMemo(() => productImageSources(product), [product]);
  const [activeImage, setActiveImage] = useState(images[0] ?? '');
  const [activeColor, setActiveColor] = useState(product.colors[0] ?? '');
  const [activeStorage, setActiveStorage] = useState(product.storage_prices[0]?.label ?? product.storage[0] ?? '');

  const selectedStorage = useMemo(
    () => product.storage_prices.find((item) => item.label === activeStorage) ?? product.storage_prices[0],
    [activeStorage, product.storage_prices]
  );
  const displayPrice = selectedStorage?.price_bhd ?? product.price_bhd;

  useEffect(() => {
    setActiveImage(images[0] ?? '');
  }, [images]);
  const colorTone = activeColor.toLowerCase();
  const colorClass = colorTone.includes('white') || colorTone.includes('silver')
    ? 'from-white via-zinc-300 to-zinc-500'
    : colorTone.includes('green')
      ? 'from-emerald-300 via-emerald-700 to-black'
      : colorTone.includes('pink')
        ? 'from-pink-300 via-brand-neon to-black'
        : colorTone.includes('titanium') || colorTone.includes('gray')
          ? 'from-zinc-300 via-zinc-600 to-black'
          : 'from-zinc-950 via-zinc-700 to-brand-neon/70';

  return (
    <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-neon md:p-4">
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-[#111115] p-4">
        <ProductLikeButton
          productId={product.id}
          initialLikes={product.likes}
          label={locale === 'ar' ? 'إعجاب بالمنتج' : 'Like product'}
        />
        <FallbackImage alt={productName(product, locale)} className="h-full w-full rounded-xl object-cover" src={activeImage}>
          <div className="grid h-full w-full place-items-center rounded-[28px] bg-black text-center text-white">
            <div className={`h-56 w-40 rounded-[34px] border border-white/20 bg-gradient-to-br ${colorClass} shadow-neon-strong`} />
          </div>
        </FallbackImage>
      </div>

      {images.length > 1 ? (
        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          {images.map((image) => (
            <button
              aria-label={locale === 'ar' ? 'تغيير صورة المنتج' : 'Change product image'}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-black p-1 ${activeImage === image ? 'border-brand-neon' : 'border-white/10'}`}
              key={image}
              onClick={() => setActiveImage(image)}
              type="button"
            >
              <FallbackImage alt="" className="h-full w-full rounded-lg object-cover" src={image}>
                <div className={`h-full w-full rounded-lg bg-gradient-to-br ${colorClass}`} />
              </FallbackImage>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-white/10 bg-black/50 p-3">
        <div>
          <p className="text-xs font-black text-white/45">{locale === 'ar' ? 'اختر السعة' : 'Choose storage'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.storage_prices.map((item) => (
              <button
                className={`rounded-full border px-4 py-2 text-xs font-black ${activeStorage === item.label ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-white/5 text-white'}`}
                key={item.label}
                onClick={() => setActiveStorage(item.label)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-white/45">{locale === 'ar' ? 'بدّل اللون' : 'Switch color'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                className={`rounded-full border px-4 py-2 text-xs font-black ${activeColor === color ? 'border-brand-neon bg-white text-black' : 'border-white/10 bg-white/5 text-white'}`}
                key={color}
                onClick={() => setActiveColor(color)}
                type="button"
              >
                {color}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 py-3">
          <span className="text-sm font-black text-white">{activeStorage} / {activeColor}</span>
          <strong className="text-xl font-black text-brand-neon">{formatPrice(displayPrice, locale)}</strong>
        </div>
      </div>
    </section>
  );
}
