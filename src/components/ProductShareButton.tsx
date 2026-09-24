'use client';

import {useState} from 'react';
import {formatPrice, productName} from '@/lib/format';
import {directPurchaseUrl} from '@/lib/directPurchase';
import {primaryProductImage} from '@/lib/productNormalize';
import type {Locale, Product, ProductVariant} from '@/lib/types';
import {variantPrice} from '@/lib/variants';

export function ProductShareButton({product, locale, selectedVariant, compact = false, dark = false}: {product: Product; locale: Locale; selectedVariant?: ProductVariant | null; compact?: boolean; dark?: boolean}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = directPurchaseUrl(product, locale, selectedVariant);
    const title = productName(product, locale);
    const text = `${title} - ${formatPrice(variantPrice(product, selectedVariant), locale)}`;

    if (navigator.share) {
      try {
        const imageUrl = primaryProductImage(product);
        if (imageUrl && navigator.canShare) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
            const file = new File([blob], `7phone-product.${extension}`, {type: blob.type || 'image/jpeg'});
            if (navigator.canShare({files: [file]})) {
              await navigator.share({title, text, url, files: [file]});
              return;
            }
          } catch {
            // Image file sharing is optional on browsers that cannot fetch/share it.
          }
        }
        await navigator.share({title, text, url});
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      className={`${compact ? 'h-11 px-3 text-xs' : 'h-12 px-5 text-sm'} whitespace-nowrap rounded-xl border border-brand-neon/60 font-black text-brand-neon transition hover:border-brand-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${dark ? 'bg-white/5 hover:bg-brand-neon/10' : 'bg-white hover:bg-brand-neon/5'}`}
      onClick={share}
      type="button"
    >
      {copied
        ? locale === 'ar' ? '✅ تم نسخ رابط الشراء' : '✅ Purchase link copied'
        : locale === 'ar' ? '📤 مشاركة المنتج' : '📤 Share Product'}
    </button>
  );
}
