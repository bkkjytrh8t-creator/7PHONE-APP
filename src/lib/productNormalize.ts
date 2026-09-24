import type {Product, ProductImage, ProductMedia, ProductVariant} from './types';
import {parseProductVideoUrl} from './productMedia';
import {sanitizeProductContentBlocks} from './productContent';

type ProductRecord = Product & Record<string, unknown>;
const brokenImageUrlMarkers = [
  '1782932506248-24a44258-1f0a-4ca9-8d58-718bc9942adf.jpg'
];

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

function galleryList(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (isNonEmptyString(item)) {
      return [{url: item.trim(), color: null}];
    }

    if (!item || typeof item !== 'object') {
      return [];
    }

    const record = item as Record<string, unknown>;
    const [url] = imageFromObject(record);

    if (!url) {
      return [];
    }

    return [{
      url: url.trim(),
      color: isNonEmptyString(record.color) ? record.color.trim() : null
    }];
  });
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
  const data: ProductRecord = record.data && typeof record.data === 'object' ? record.data as ProductRecord : {} as ProductRecord;
  const mediaValue = record.media_gallery ?? data.media_gallery;
  const mediaRows = Array.isArray(mediaValue) ? mediaValue : [];
  const mediaImages = mediaRows.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const media = item as Record<string, unknown>;
    return media.media_type !== 'video' && isNonEmptyString(media.url) ? [media.url] : [];
  });
  const sources = [
    ...mediaImages,
    ...galleryList(record.image_gallery ?? data.image_gallery).map((image) => image.url),
    ...imageList(record.images),
    ...imageList(record.image),
    ...imageList(record.imageUrl),
    ...imageList(record.image_url),
    ...imageList(record.image_urls),
    ...imageList(record.productImages),
    ...imageList(record.product_images)
  ];

  return Array.from(new Set(
    sources
      .map((source) => source.trim())
      .filter((source) => source && !parseProductVideoUrl(source) && !brokenImageUrlMarkers.some((marker) => source.includes(marker)))
  ));
}

export function primaryProductImage(product: Product) {
  const primary = product.media_gallery?.find((item) => item.media_type === 'image' && item.is_primary)?.url;
  return primary ?? productImageSources(product)[0] ?? '';
}

export function heroProductImage(product: Product) {
  const record = product as ProductRecord;
  const data: ProductRecord = record.data && typeof record.data === 'object' ? record.data as ProductRecord : {} as ProductRecord;
  const heroImage = record.hero_banner_image_url ?? data.hero_banner_image_url;
  return isNonEmptyString(heroImage) ? heroImage.trim() : primaryProductImage(product);
}

export function productImageGallery(product: Product): ProductImage[] {
  const record = product as ProductRecord;
  const data: ProductRecord = record.data && typeof record.data === 'object' ? record.data as ProductRecord : {} as ProductRecord;
  const gallery = galleryList(record.image_gallery ?? data.image_gallery);
  const galleryUrls = new Set(gallery.map((image) => image.url));
  const sourceImages = productImageSources(product)
    .filter((url) => !galleryUrls.has(url))
    .map((url) => ({url, color: null}));
  const mergedGallery = [...gallery, ...sourceImages];

  if (mergedGallery.length) {
    const seen = new Set<string>();
    return mergedGallery.filter((image) => {
      const key = `${image.color ?? ''}:${image.url}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  return productImageSources(product).map((url) => ({url, color: null}));
}

export function productImagesForColor(product: Product, color: string) {
  const normalizedColor = color.trim().toLowerCase();
  const gallery = productImageGallery(product);
  const colorImages = normalizedColor
    ? gallery.filter((image) => image.color?.trim().toLowerCase() === normalizedColor)
    : [];

  return colorImages.length ? colorImages.map((image) => image.url) : productImageSources(product);
}

function listOrEmpty(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => listOrEmpty(item));
  }

  if (isNonEmptyString(value)) {
    const trimmed = value.trim();

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('"[') && trimmed.endsWith(']"'))) {
      try {
        return listOrEmpty(JSON.parse(trimmed));
      } catch {
        return trimmed === '[]' ? [] : [trimmed];
      }
    }
  }

  return isNonEmptyString(value) ? [value] : [];
}

function firstNonEmptyList(...values: unknown[]) {
  for (const value of values) {
    const list = listOrEmpty(value);

    if (list.length) {
      return list;
    }
  }

  return [];
}

function storageFromText(product: ProductRecord, data: ProductRecord) {
  const ramValues = firstNonEmptyList(product.ram, data.ram)
    .map((value) => value.replace(/\s+/g, '').toUpperCase());
  const text = [
    product.short_description_en,
    product.short_description_ar,
    data.short_description_en,
    data.short_description_ar,
    product.description_en,
    product.description_ar,
    product.specifications_en,
    product.specifications_ar,
    product.specs_en,
    product.specs_ar,
    data.details_specifications,
    data.features
  ].flatMap((value) => listOrEmpty(value)).join(' ');

  if (!text) {
    return [];
  }

  const normalizedText = text.replace(/\s+/g, ' ');
  const pairedPattern = /(\d+(?:\.\d+)?\s*(?:GB|TB))\s*(?:\/|\+|,|\s+)?\s*(\d+(?:\.\d+)?\s*GB)\s*RAM/gi;
  const pairedMatches = Array.from(normalizedText.matchAll(pairedPattern));

  for (const match of pairedMatches) {
    const storage = match[1]?.replace(/\s+/g, '').toUpperCase();
    const ram = match[2]?.replace(/\s+/g, '').toUpperCase();

    if (storage && (!ramValues.length || ramValues.includes(ram))) {
      return [storage];
    }
  }

  const slashPattern = /(\d+(?:\.\d+)?\s*GB)\s*\/\s*(\d+(?:\.\d+)?\s*(?:GB|TB))/gi;
  const slashMatches = Array.from(normalizedText.matchAll(slashPattern));

  for (const match of slashMatches) {
    const ram = match[1]?.replace(/\s+/g, '').toUpperCase();
    const storage = match[2]?.replace(/\s+/g, '').toUpperCase();

    if (storage && (!ramValues.length || ramValues.includes(ram))) {
      return [storage];
    }
  }

  const looseSlashMatch = normalizedText.match(/\d+(?:\.\d+)?\s*GB\s*\/\s*(\d+(?:\.\d+)?\s*(?:GB|TB))/i);
  const looseSlashStorage = looseSlashMatch?.[1]?.replace(/\s+/g, '').toUpperCase();

  if (looseSlashStorage) {
    return [looseSlashStorage];
  }

  const labelBeforeValueMatch = normalizedText.match(/(?:internal memory|internal storage|storage capacity|memory\s*&\s*storage|storage|rom|internal)\s*(?:[:\-–—]|\s)+(\d+(?:\.\d+)?\s*(?:GB|TB))/i);
  const labelAfterValueMatch = normalizedText.match(/(\d+(?:\.\d+)?\s*(?:GB|TB))\s*(?:ROM|storage|internal memory|internal)/i);
  const storage = (labelBeforeValueMatch?.[1] ?? labelAfterValueMatch?.[1])?.replace(/\s+/g, '').toUpperCase();

  return storage ? [storage] : [];
}

function numericProductId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(value: unknown, fallback = false) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function normalizedVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const variant = item as Record<string, unknown>;
    const images = imageList(variant.images ?? variant.image_urls);
    return [{
      id: isNonEmptyString(variant.id) ? variant.id : `variant-${index + 1}`,
      color: isNonEmptyString(variant.color) ? variant.color : '',
      color_en: isNonEmptyString(variant.color_en) ? variant.color_en : '',
      color_ar: isNonEmptyString(variant.color_ar) ? variant.color_ar : '',
      color_hex: isNonEmptyString(variant.color_hex) ? variant.color_hex : '',
      storage: isNonEmptyString(variant.storage) ? variant.storage : '',
      ram: isNonEmptyString(variant.ram) ? variant.ram : '',
      warranty: isNonEmptyString(variant.warranty) ? variant.warranty : '',
      price_bhd: optionalNumber(variant.price_bhd),
      old_price_bhd: optionalNumber(variant.old_price_bhd),
      stock: optionalNumber(variant.stock),
      sku: isNonEmptyString(variant.sku) ? variant.sku : '',
      available: booleanValue(variant.available, true),
      is_default: booleanValue(variant.is_default),
      most_popular: booleanValue(variant.most_popular),
      images
    }];
  });
}

function normalizedMedia(value: unknown, product: Product, rawProduct: Product): ProductMedia[] {
  const rows = Array.isArray(value) ? value : [];
  const media = rows.flatMap<ProductMedia>((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const url = isNonEmptyString(row.url) ? row.url.trim() : '';
    if (!url) return [];
    const mediaType = row.media_type === 'video' ? 'video' : 'image';
    if (row.status === 'hidden') return [];
    if (mediaType === 'video') {
      const parsed = parseProductVideoUrl(url);
      if (!parsed) return [];
      return [{
        id: isNonEmptyString(row.id) ? row.id : `video-${index + 1}`,
        product_id: numericProductId(row.product_id),
        media_type: 'video' as const,
        source_type: parsed.source_type,
        url: parsed.url,
        thumbnail_url: isNonEmptyString(row.thumbnail_url) ? row.thumbnail_url : parsed.thumbnail_url,
        sort_order: Number(row.sort_order ?? index),
        is_primary: false,
        status: 'active',
        created_at: isNonEmptyString(row.created_at) ? row.created_at : undefined
      }];
    }
    return [{
      id: isNonEmptyString(row.id) ? row.id : `image-${index + 1}`,
      product_id: numericProductId(row.product_id),
      media_type: 'image' as const,
      source_type: row.source_type === 'upload' ? 'upload' as const : 'external_url' as const,
      url,
      thumbnail_url: isNonEmptyString(row.thumbnail_url) ? row.thumbnail_url : url,
      sort_order: Number(row.sort_order ?? index),
      is_primary: booleanValue(row.is_primary, index === 0),
      status: 'active',
      color: isNonEmptyString(row.color) ? row.color : null,
      created_at: isNonEmptyString(row.created_at) ? row.created_at : undefined
    }];
  }).sort((a, b) => a.sort_order - b.sort_order);
  const knownImages = new Set(media.filter((item) => item.media_type === 'image').map((item) => item.url));
  const knownVideos = new Set(media.filter((item) => item.media_type === 'video').map((item) => item.url));
  const rawRecord = rawProduct as ProductRecord;
  const rawData: ProductRecord = rawRecord.data && typeof rawRecord.data === 'object' ? rawRecord.data as ProductRecord : {} as ProductRecord;
  const legacyVideoUrls = Array.from(new Set([
    ...imageList(rawRecord.images),
    ...imageList(rawRecord.image_urls),
    ...imageList(rawRecord.image_url),
    ...galleryList(rawRecord.image_gallery ?? rawData.image_gallery).map((item) => item.url),
    ...imageList(rawRecord.product_images)
  ])).filter((url) => parseProductVideoUrl(url) && !knownVideos.has(url));
  const imageFallbacks = productImageGallery(product).filter((image) => !knownImages.has(image.url)).map((image, index) => ({
    id: `legacy-image-${index + 1}`,
    product_id: product.id,
    media_type: 'image' as const,
    source_type: 'external_url' as const,
    url: image.url,
    thumbnail_url: image.url,
    sort_order: media.length + index,
    is_primary: media.every((item) => item.media_type !== 'image') && index === 0,
    color: image.color
  }));
  const videoFallbacks = legacyVideoUrls.flatMap((url, index) => {
    const parsed = parseProductVideoUrl(url);
    return parsed ? [{
      id: `legacy-video-${index + 1}`,
      product_id: product.id,
      media_type: 'video' as const,
      source_type: parsed.source_type,
      url: parsed.url,
      thumbnail_url: parsed.thumbnail_url,
      sort_order: media.length + imageFallbacks.length + index,
      is_primary: false
    }] : [];
  });
  const combined = [...media, ...imageFallbacks, ...videoFallbacks];
  if (!combined.some((item) => item.media_type === 'image' && item.is_primary)) {
    const firstImage = combined.find((item) => item.media_type === 'image');
    if (firstImage) firstImage.is_primary = true;
  }
  const primaryIndex = combined.findIndex((item) => item.media_type === 'image' && item.is_primary);
  if (primaryIndex > 0) combined.unshift(combined.splice(primaryIndex, 1)[0]);
  return combined.map((item, index) => ({...item, sort_order: index, is_primary: item.media_type === 'image' && item.is_primary}));
}

export function normalizeProduct(product: Product): Product {
  const record = product as ProductRecord;
  const data: ProductRecord = record.data && typeof record.data === 'object' ? record.data as ProductRecord : {} as ProductRecord;
  const stockStatus = isNonEmptyString(record.stock_status) ? record.stock_status : isNonEmptyString(record.status) ? record.status : 'available';
  const rowStatus = isNonEmptyString(record.status) ? record.status : stockStatus;
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

  const normalized: Product = {
    ...product,
    id: numericProductId(record.id),
    description_en: isNonEmptyString(record.description_en) ? record.description_en : '',
    description_ar: isNonEmptyString(record.description_ar) ? record.description_ar : '',
    short_description_en: isNonEmptyString(record.short_description_en) ? record.short_description_en : isNonEmptyString(data.short_description_en) ? data.short_description_en : '',
    short_description_ar: isNonEmptyString(record.short_description_ar) ? record.short_description_ar : isNonEmptyString(data.short_description_ar) ? data.short_description_ar : '',
    price_bhd: typeof record.price_bhd === 'number' ? record.price_bhd : Number(record.price ?? 0),
    old_price_bhd: record.old_price_bhd ? Number(record.old_price_bhd) : record.old_price ? Number(record.old_price) : null,
    brand: brandValue,
    category: categoryValue,
    warranty: isNonEmptyString(record.warranty) ? record.warranty : isNonEmptyString(data.warranty) ? data.warranty : '',
    installments: isNonEmptyString(record.installments) ? record.installments : isNonEmptyString(data.installments) ? data.installments : '',
    stock_status: stockStatus,
    images: productImageSources(product),
    hero_banner_image_url: isNonEmptyString(record.hero_banner_image_url)
      ? record.hero_banner_image_url
      : isNonEmptyString(data.hero_banner_image_url)
        ? data.hero_banner_image_url
        : '',
    image_gallery: productImageGallery(product),
    storage: firstNonEmptyList(
      record.storage,
      data.storage,
      record.storageCapacity,
      data.storageCapacity,
      record.capacity,
      data.capacity,
      record.memory,
      data.memory,
      (Array.isArray(record.variants) ? record.variants : Array.isArray(data.variants) ? data.variants : []).map((variant) => variant.storage),
      (Array.isArray(record.storage_prices) ? record.storage_prices : Array.isArray(data.storage_prices) ? data.storage_prices : []).map((item) => item.label),
      storageFromText(record, data)
    ),
    colors: listOrEmpty(record.colors ?? data.colors),
    color_options: (Array.isArray(data.color_options) ? data.color_options : []).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const option = item as Record<string, unknown>;
      const name = isNonEmptyString(option.name) ? option.name.trim() : '';
      const hex = isNonEmptyString(option.hex) && /^#[0-9a-f]{6}$/i.test(option.hex.trim()) ? option.hex.trim() : '#d4d4d8';
      return name ? [{name, hex}] : [];
    }),
    features: listOrEmpty(record.features ?? data.features),
    details_specifications: listOrEmpty(record.details_specifications ?? data.details_specifications),
    box_contents: listOrEmpty(record.box_contents ?? data.box_contents),
    warranty_details: isNonEmptyString(record.warranty_details) ? record.warranty_details : isNonEmptyString(data.warranty_details) ? data.warranty_details : '',
    additional_notes: isNonEmptyString(record.additional_notes) ? record.additional_notes : isNonEmptyString(data.additional_notes) ? data.additional_notes : '',
    product_content_blocks: sanitizeProductContentBlocks(record.product_content_blocks ?? data.product_content_blocks ?? record.content_blocks ?? data.content_blocks ?? record.product_content ?? data.product_content ?? record.rich_content ?? data.rich_content),
    tags: listOrEmpty(record.tags ?? data.tags),
    variants_enabled: booleanValue(record.variants_enabled ?? data.variants_enabled, true),
    variants: normalizedVariants(Array.isArray(record.variants) ? record.variants : data.variants),
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
    is_active: (typeof record.is_active === 'boolean' ? record.is_active : true) && stockStatus !== 'deleted' && rowStatus !== 'deleted',
    badge: product.badge ?? (record.is_offer ? 'deal' : record.is_new ? 'new' : record.is_featured ? 'best-seller' : 'none'),
    quantity: optionalNumber(record.quantity ?? data.quantity),
    stock_quantity: optionalNumber(record.stock_quantity ?? data.stock_quantity),
    inventory: optionalNumber(record.inventory ?? data.inventory),
    available: record.available ?? data.available ?? null,
    comparison: product.comparison ?? data.comparison as Product['comparison'] ?? {display: '', camera: '', battery: '', processor: ''}
  };
  normalized.media_gallery = normalizedMedia(record.media_gallery ?? data.media_gallery, normalized, product);
  return normalized;
}

export function productIsDeleted(product: Product) {
  const record = product as ProductRecord;
  const rowStatus = isNonEmptyString(record.status) ? record.status.trim().toLowerCase() : '';
  const stockStatus = isNonEmptyString(product.stock_status) ? product.stock_status.trim().toLowerCase() : '';
  return rowStatus === 'deleted' || stockStatus === 'deleted';
}

export function productIsVisible(product: Product) {
  return product.is_active && !productIsDeleted(product) && product.stock_status !== 'hidden';
}

export function normalizeProducts(products: Product[]) {
  const normalized = products.map(normalizeProduct).filter((product) => product.id > 0);
  const byId = new Map<number, Product>();

  normalized.forEach((product) => {
    const existing = byId.get(product.id);

    if (!existing || Date.parse(product.created_at) > Date.parse(existing.created_at)) {
      byId.set(product.id, product);
    }
  });

  return Array.from(byId.values());
}
