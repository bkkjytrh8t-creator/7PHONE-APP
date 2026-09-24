import type {Locale, Product, ProductVariant} from './types';

const productionOrigin = 'https://7phone.app';

export function slugifyProductName(value: string) {
  return value.trim().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function directPurchaseKey(product: Product) {
  const storedSlug = product.slug?.trim();
  if (storedSlug) return storedSlug;
  const generated = slugifyProductName(product.name_en || product.name_ar || 'product');
  return `${generated || 'product'}-${product.id}`;
}

export function directPurchasePath(product: Product, locale: Locale, variant?: ProductVariant | null) {
  const path = `/buy/${encodeURIComponent(directPurchaseKey(product))}`;
  const query = new URLSearchParams();
  if (locale === 'en') query.set('lang', 'en');
  if (variant?.sku?.trim()) query.set('v', variant.sku.trim());
  return query.size ? `${path}?${query}` : path;
}

export function directPurchaseUrl(product: Product, locale: Locale, variant?: ProductVariant | null) {
  return `${productionOrigin}${directPurchasePath(product, locale, variant)}`;
}

export function productIdFromDirectKey(key: string) {
  const match = decodeURIComponent(key).match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}
