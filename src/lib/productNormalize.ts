import type {Product} from './types';

type ProductRecord = Product & Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function imageFromObject(value: unknown) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  return [record.url, record.path, record.src, record.imageUrl, record.image_url].filter(isNonEmptyString);
}

function imageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => (isNonEmptyString(item) ? [item] : imageFromObject(item)));
  }

  if (isNonEmptyString(value)) {
    return [value];
  }

  return imageFromObject(value);
}

export function productImageSources(product: Product): string[] {
  const record = product as ProductRecord;
  const sources = [
    ...imageList(record.images),
    ...imageList(record.image),
    ...imageList(record.imageUrl),
    ...imageList(record.image_url),
    ...imageList(record.productImages),
    ...imageList(record.product_images)
  ];

  return Array.from(new Set(sources.map((source) => source.trim()).filter(Boolean)));
}

export function primaryProductImage(product: Product) {
  return productImageSources(product)[0] ?? '';
}

function listOrEmpty(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  return isNonEmptyString(value) ? [value] : [];
}

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    images: productImageSources(product),
    storage: listOrEmpty((product as ProductRecord).storage),
    colors: listOrEmpty((product as ProductRecord).colors),
    storage_prices: Array.isArray((product as ProductRecord).storage_prices) ? product.storage_prices : [],
    specifications_ar: listOrEmpty((product as ProductRecord).specifications_ar),
    specifications_en: listOrEmpty((product as ProductRecord).specifications_en),
    accessories: Array.isArray((product as ProductRecord).accessories) ? product.accessories : []
  };
}

export function normalizeProducts(products: Product[]) {
  return products.map(normalizeProduct);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

export function productRouteKey(product: Product) {
  if (Number.isFinite(product.id) && product.id > 0) {
    return String(product.id);
  }

  return slugify(product.name_en || product.name_ar || 'product');
}

export function productMatchesRouteKey(product: Product, routeKey: string) {
  return (
    String(product.id) === routeKey ||
    slugify(product.name_en || '') === routeKey ||
    slugify(product.name_ar || '') === routeKey
  );
}
