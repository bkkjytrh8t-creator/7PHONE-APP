'use client';

import {formatPrice, productName} from '@/lib/format';
import {primaryProductImage} from '@/lib/productNormalize';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {defaultProductVariant, variantPrice} from '@/lib/variants';
import {WhatsAppButton} from './WhatsAppButton';

export function DirectPurchaseCheckout({product, locale, settings, requestedSku}: {product: Product; locale: Locale; settings: StoreSettings; requestedSku?: string}) {
  const name = productName(product, locale);
  const image = primaryProductImage(product);
  const buyLabel = locale === 'ar' ? 'اشتر الآن' : 'Buy Now';
  const selectedVariant = defaultProductVariant(product, requestedSku);

  return (
    <main className="storefront-shell grid min-h-screen place-items-center bg-[#f5f5f7] px-4 py-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <section className="w-full max-w-md rounded-[28px] border border-[#ececec] bg-white p-6 text-center shadow-[0_20px_60px_rgba(17,17,17,0.08)]">
        {image ? <img alt={name} className="mx-auto h-56 w-full object-contain" src={image} /> : null}
        <h1 className="mt-5 text-2xl font-black text-[#111111]">{name}</h1>
        <p className="mt-2 text-xl font-black text-brand-neon">{formatPrice(variantPrice(product, selectedVariant), locale)}</p>
        <p className="mt-3 text-sm font-semibold text-[#666666]">
          {locale === 'ar' ? 'أكمل بياناتك في نافذة الطلب.' : 'Complete your details in the order window.'}
        </p>
        <div className="mt-5">
          <WhatsAppButton autoOpen large product={product} locale={locale} settings={settings} label={buyLabel} selectedVariant={selectedVariant} />
        </div>
      </section>
    </main>
  );
}
