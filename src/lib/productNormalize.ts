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
    ...imageList(record.image_urls),
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
  const record = product as ProductRecord;
  const data: ProductRecord = record.data && typeof record.data === 'object' ? record.data as ProductRecord : {} as ProductRecord;
  const brandValue = record.brand && typeof record.brand === 'object'
    ? product.brand
    : {
        id: 0,
        name_en: isNonEmptyString(record.brand) ? record.brand : '',
        name_ar: isNonEmptyString(record.brand) ? record.brand : ''
      };
  const categoryValue = record.category && typeof record.category === 'object'
    ? product.category
    : {
        id: 0,
        slug: isNonEmptyString(record.category) ? record.category : 'uncategorized',
        name_en: isNonEmptyString(record.category) ? record.category : '',
        name_ar: isNonEmptyString(record.category) ? record.category : '',
        icon: '',
        sort_order: 0
      };

  return {
    ...product,
    description_en: isNonEmptyString(record.description_en) ? record.description_en : '',
    description_ar: isNonEmptyString(record.description_ar) ? record.description_ar : '',
    price_bhd: typeof record.price_bhd === 'number' ? record.price_bhd : Number(record.price ?? 0),
    old_price_bhd: record.old_price_bhd ? Number(record.old_price_bhd) : record.old_price ? Number(record.old_price) : null,
    brand: brandValue,
    category: categoryValue,
    warranty: isNonEmptyString(record.warranty) ? record.warranty : isNonEmptyString(data.warranty) ? data.warranty : '',
    installments: isNonEmptyString(record.installments) ? record.installments : isNonEmptyString(data.installments) ? data.installments : '',
    stock_status: isNonEmptyString(record.stock_status) ? record.stock_status : isNonEmptyString(record.status) ? record.status : 'available',
    images: productImageSources(product),
    storage: listOrEmpty(record.storage ?? data.storage),
    colors: listOrEmpty(record.colors ?? data.colors),
    storage_prices: Array.isArray(record.storage_prices) ? product.storage_prices : Array.isArray(data.storage_prices) ? data.storage_prices as Product['storage_prices'] : [],
    specifications_ar: listOrEmpty(record.specifications_ar ?? record.specs_ar),
    specifications_en: listOrEmpty(record.specifications_en ?? record.specs_en),
    accessories: Array.isArray(record.accessories) ? product.accessories : [],
    views: Number(record.views ?? 0),
    shares: Number(record.shares ?? data.shares ?? 0),
    orders: Number(record.orders ?? record.whatsapp_clicks ?? 0),
    likes: Number(record.likes ?? 0),
    sold_count: Number(record.sold_count ?? data.sold_count ?? 0),
    rating: Number(record.rating ?? data.rating ?? 0),
    review_count: Number(record.review_count ?? data.review_count ?? 0),
    is_active: typeof record.is_active === 'boolean' ? record.is_active : record.status !== 'deleted',
    badge: product.badge ?? (record.is_offer ? 'deal' : record.is_new ? 'new' : record.is_featured ? 'best-seller' : 'none'),
    comparison: product.comparison ?? data.comparison as Product['comparison'] ?? {display: '', camera: '', battery: '', processor: ''}
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
