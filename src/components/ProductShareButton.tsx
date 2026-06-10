'use client';

import {useState} from 'react';
import {formatPrice, productName} from '@/lib/format';
import type {Locale, Product} from '@/lib/types';

export function ProductShareButton({product, locale}: {product: Product; locale: Locale}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const title = productName(product, locale);
    const text = `${title} - ${formatPrice(product.price_bhd, locale)}`;

    if (navigator.share) {
      await navigator.share({title, text, url});
      return;
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      className="h-12 rounded-xl border border-white/10 bg-white/10 px-5 text-sm font-black text-white hover:border-brand-neon"
      onClick={share}
      type="button"
    >
      {copied ? 'تم نسخ الرابط' : 'مشاركة المنتج'}
    </button>
  );
}
