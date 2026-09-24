'use client';

import type {Locale, Product, ProductVariant} from '@/lib/types';
import {productName} from '@/lib/format';
import {primaryProductImage} from '@/lib/productNormalize';
import {variantColor, variantKey, variantPrice} from '@/lib/variants';
import {useCart} from './CartProvider';

export function AddToCartButton({product, locale, variant, disabled}: {product: Product; locale: Locale; variant?: ProductVariant | null; disabled?: boolean}) {
  const cart = useCart();
  const options = {
    ...(variant?.storage ? {[locale === 'ar' ? 'السعة' : 'Storage']: variant.storage} : {}),
    ...(variant?.ram ? {[locale === 'ar' ? 'الرام' : 'RAM']: variant.ram} : {}),
    ...(variantColor(variant ?? {}, locale) ? {[locale === 'ar' ? 'اللون' : 'Color']: variantColor(variant ?? {}, locale)} : {}),
    ...(variant?.warranty ? {[locale === 'ar' ? 'الضمان' : 'Warranty']: variant.warranty} : {})
  };
  const key = `${product.id}:${variant ? variantKey(variant) : Object.values(options).join('|') || 'default'}`;

  return <button className="min-h-12 w-full rounded-full border-2 border-brand-neon bg-white px-6 py-3.5 text-base font-black text-brand-neon transition hover:bg-brand-neon/5 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400" disabled={disabled} onClick={() => cart.addItem({key, productId: product.id, name: productName(product, locale), image: primaryProductImage(product), price: variantPrice(product, variant), options, sku: variant?.sku})} type="button">{locale === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</button>;
}
