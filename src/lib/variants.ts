import type {Locale, Product, ProductVariant} from './types';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function variantColor(variant: ProductVariant, locale: Locale) {
  return clean(locale === 'ar' ? variant.color_ar : variant.color_en)
    || clean(variant.color)
    || clean(locale === 'ar' ? variant.color_en : variant.color_ar);
}

export function variantKey(variant: ProductVariant, index = 0) {
  return clean(variant.sku) || clean(variant.id) || [
    clean(variant.color_en || variant.color),
    clean(variant.storage),
    clean(variant.ram),
    index
  ].join('|');
}

export function variantAvailable(variant: ProductVariant) {
  return variant.available !== false && (variant.stock === null || variant.stock === undefined || Number(variant.stock) > 0);
}

export function productVariants(product: Product) {
  const seen = new Set<string>();
  return (product.variants ?? []).filter((variant, index) => {
    const key = [
      clean(variant.color_en || variant.color).toLowerCase(),
      clean(variant.storage).toLowerCase(),
      clean(variant.ram).toLowerCase()
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(variantKey(variant, index));
  });
}

export function defaultProductVariant(product: Product, requestedSku?: string | null) {
  const variants = productVariants(product);
  const available = variants.filter(variantAvailable);
  const requested = clean(requestedSku).toLowerCase();
  return (requested ? available.find((variant) => clean(variant.sku).toLowerCase() === requested) : undefined)
    ?? available.find((variant) => variant.is_default)
    ?? available[0]
    ?? null;
}

export function variantPrice(product: Product, variant?: ProductVariant | null) {
  return variant?.price_bhd !== null && variant?.price_bhd !== undefined
    ? Number(variant.price_bhd)
    : product.price_bhd;
}

export function variantImages(product: Product, variant?: ProductVariant | null) {
  const images = (variant?.images ?? []).map(clean).filter(Boolean);
  return images.length ? images : [];
}

export function uniqueVariantValues(variants: ProductVariant[], field: 'storage' | 'ram') {
  return Array.from(new Set(variants.map((variant) => clean(variant[field])).filter(Boolean)));
}
