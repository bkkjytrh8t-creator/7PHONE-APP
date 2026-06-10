import type {Locale, Product} from './types';

export function productName(product: Product, locale: Locale) {
  return locale === 'ar' ? product.name_ar : product.name_en;
}

export function productDescription(product: Product, locale: Locale) {
  return locale === 'ar' ? product.description_ar : product.description_en;
}

export function categoryName(product: Product, locale: Locale) {
  return locale === 'ar' ? product.category.name_ar : product.category.name_en;
}

export function brandName(product: Product, locale: Locale) {
  return locale === 'ar' ? product.brand.name_ar : product.brand.name_en;
}

export function formatPrice(price: number, locale: Locale) {
  return locale === 'ar' ? `${price} د.ب` : `BHD ${price}`;
}
