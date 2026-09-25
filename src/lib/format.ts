import type {Locale, Product} from './types';

type ProductRecord = Product & Record<string, unknown>;
type UnknownRecord = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function dataRecord(product: Product): UnknownRecord {
  const record = product as ProductRecord;
  return record.data && typeof record.data === 'object' ? record.data as UnknownRecord : {};
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => listValue(item));
  }

  if (!isNonEmptyString(value)) {
    return [];
  }

  const trimmed = value.trim();

  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('"[') && trimmed.endsWith(']"'))) {
    try {
      return listValue(JSON.parse(trimmed));
    } catch {
      return trimmed === '[]' ? [] : [trimmed];
    }
  }

  return [trimmed];
}

function hasArabicText(value: string) {
  return /[\u0600-\u06ff]/.test(value);
}

function commonEnglishText(value: string) {
  const normalized = value.trim();

  if (normalized === 'ضمان سنة' || normalized === 'ضمان 7Phone - سنة كاملة') {
    return '1 year warranty';
  }

  if (normalized === 'ضمان الوكيل - سنة كاملة') {
    return 'Agent warranty - 1 year';
  }

  return '';
}

function localizedKey(base: string, locale: Locale) {
  return locale === 'ar' ? `${base}_ar` : `${base}_en`;
}

function fallbackKey(base: string, locale: Locale) {
  return locale === 'ar' ? `${base}_en` : `${base}_ar`;
}

export function productName(product: Product, locale: Locale) {
  return locale === 'ar' ? product.name_ar || product.name_en : product.name_en || product.name_ar;
}

export function productDescription(product: Product, locale: Locale) {
  return locale === 'ar' ? product.description_ar || product.description_en : product.description_en || product.description_ar;
}

export function categoryName(product: Product, locale: Locale) {
  return locale === 'ar' ? product.category.name_ar || product.category.name_en : product.category.name_en || product.category.name_ar;
}

export function brandName(product: Product, locale: Locale) {
  return locale === 'ar' ? product.brand.name_ar || product.brand.name_en : product.brand.name_en || product.brand.name_ar;
}

export function formatPrice(price: number, locale: Locale) {
  return locale === 'ar' ? `${price} د.ب` : `BHD ${price}`;
}

export function localizedProductText(product: Product, base: string, locale: Locale, fallback = '') {
  const record = product as ProductRecord;
  const data = dataRecord(product);
  const localized = record[localizedKey(base, locale)] ?? data[localizedKey(base, locale)];
  const sameField = record[base] ?? data[base];
  const fallbackLocalized = record[fallbackKey(base, locale)] ?? data[fallbackKey(base, locale)];

  if (isNonEmptyString(localized)) return localized;
  if (isNonEmptyString(sameField)) {
    const translated = locale === 'en' ? commonEnglishText(sameField) : '';

    if (translated) return translated;
    return sameField;
  }
  if (isNonEmptyString(fallbackLocalized)) return fallbackLocalized;

  return fallback;
}

export function localizedProductList(product: Product, base: string, locale: Locale) {
  const record = product as ProductRecord;
  const data = dataRecord(product);
  const localized = listValue(record[localizedKey(base, locale)] ?? data[localizedKey(base, locale)]);

  if (localized.length) {
    return localized;
  }

  const sameField = listValue(record[base] ?? data[base]);
  const sameFieldMatchesLocale = locale === 'ar'
    ? sameField
    : sameField.filter((item) => !hasArabicText(item));

  if (sameFieldMatchesLocale.length) {
    return sameFieldMatchesLocale;
  }

  return listValue(record[fallbackKey(base, locale)] ?? data[fallbackKey(base, locale)]);
}

export function productRamValues(product: Product) {
  const record = product as ProductRecord;
  const data = dataRecord(product);
  const direct = listValue(record.ram ?? data.ram);

  if (direct.length) {
    return direct;
  }

  const variantValues = (product.variants ?? [])
    .map((variant) => variant.ram)
    .filter((value): value is string => isNonEmptyString(value));

  return Array.from(new Set(variantValues));
}
