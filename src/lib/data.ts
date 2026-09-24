import {isSupabaseAdminConfigured, supabaseAdmin} from './adminSupabase';
import {normalizeProduct, normalizeProducts, productIsVisible} from './productNormalize';
import {settingsFromRecord} from './settingsMap';
import {supabase} from './supabase';
import type {Brand, Category, Product, StoreSettings} from './types';

type ProductImageRow = {url: string; color?: string | null; sort_order: number};
type ProductRecord = Record<string, any> & {product_images?: ProductImageRow[]};
type ProductImageRecord = ProductImageRow & {product_id: number};
export type HomepageSectionRow = {id: string; section_type?: string; title_en: string; title_ar: string; content?: Record<string, unknown>; source: string; is_visible: boolean; sort_order: number; publication_state?: 'draft' | 'published'};

function readClient() {
  return isSupabaseAdminConfigured && supabaseAdmin ? supabaseAdmin : supabase;
}

export async function getHomepageSections(): Promise<HomepageSectionRow[]> {
  const client = readClient();
  if (!client) return [];
  const {data, error} = await client.from('homepage_sections').select('*').eq('publication_state', 'published').eq('is_visible', true).order('sort_order', {ascending: true});
  let rows = data ?? [];
  if (error && isMissingTableError(error)) {
    const fallback = await client.from('store_settings').select('data').eq('id', 'main').maybeSingle();
    const stored = fallback.data?.data && typeof fallback.data.data === 'object' ? (fallback.data.data as Record<string, unknown>).homepage_sections : null;
    rows = Array.isArray(stored) ? stored : [];
  } else if (error) { logDataError('homepage-sections', error); return []; }
  return rows.filter((row: any) => row.publication_state !== 'draft' && row.is_visible !== false && !String(row.source ?? '').startsWith('admin-')).map((row: any) => ({
    id: String(row.id ?? ''), section_type: String(row.section_type ?? ''), title_en: String(row.title_en ?? ''), title_ar: String(row.title_ar ?? row.title_en ?? ''),
    content: row.content && typeof row.content === 'object' ? row.content : {}, source: String(row.source ?? ''), is_visible: row.is_visible !== false, sort_order: Number(row.sort_order ?? 0), publication_state: row.publication_state === 'draft' ? 'draft' : 'published'
  }));
}

function logDataError(scope: string, error: unknown) {
  console.error(`[data:${scope}]`, error);
}

function isMissingRelationError(error: {code?: string} | null | undefined) {
  return error?.code === 'PGRST205';
}

function isMissingTableError(error: {message?: string; code?: string} | null | undefined) {
  return Boolean(error?.message?.includes('schema cache') || error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.code === '42P01');
}

const emptySettings: StoreSettings = {
  logoUrl: '',
  bannerUrl: null,
  whatsapp: '',
  phoneSales: '',
  phoneRepairs: '',
  mapsUrl: '',
  instagram: '',
  siteUrl: '',
  benefitPayEnabled: false,
  benefitPayQr: '',
  benefitPayAccountHolder: '',
  benefitPayPhone: '',
  iban: '',
  benefitPayInstructionsAr: '',
  benefitPayInstructionsEn: '',
  paymentOptions: '',
  deliveryOptions: '',
  whatsappTemplate: ''
};

function categoryFromRecord(record: Record<string, any>): Category {
  const displayOrder = Number(record.display_order);

  return {
    id: Number(record.id),
    slug: String(record.slug ?? ''),
    name_en: String(record.name_en ?? ''),
    name_ar: String(record.name_ar ?? record.name_en ?? ''),
    icon: String(record.icon ?? ''),
    sort_order: Number(record.sort_order ?? 0),
    display_order: Number.isFinite(displayOrder) ? displayOrder : undefined,
    is_visible: record.is_visible !== false,
    is_active: record.is_active !== false
  };
}

function brandFromRecord(record: Record<string, any>): Brand {
  return {
    id: Number.isFinite(Number(record.id)) ? Number(record.id) : String(record.id ?? ''),
    name_en: String(record.name_en ?? ''),
    name_ar: String(record.name_ar ?? record.name_en ?? ''),
    logo_url: typeof record.logo_url === 'string' ? record.logo_url : null,
    sort_order: Number(record.sort_order ?? 0),
    is_visible: record.is_visible !== false,
    slug: typeof record.slug === 'string' ? record.slug : undefined,
    homepage_url: typeof record.homepage_url === 'string' ? record.homepage_url : undefined
  };
}

function emptyBrand(id: unknown): Brand {
  return {id: Number(id ?? 0), name_en: '', name_ar: '', logo_url: null};
}

function catalogKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function brandMatchesRecord(brand: Brand, record: ProductRecord) {
  const brandId = catalogKey(record.brand_id);
  const brandText = catalogKey(record.brand);

  return [
    brand.id,
    brand.slug,
    brand.name_en,
    brand.name_ar
  ].some((value) => {
    const key = catalogKey(value);
    return key && (key === brandId || key === brandText);
  });
}

function categoryMatchesRecord(category: Category, record: ProductRecord) {
  const categoryId = catalogKey(record.category_id);
  const categoryText = catalogKey(record.category);

  return [
    category.id,
    category.slug,
    category.name_en,
    category.name_ar
  ].some((value) => {
    const key = catalogKey(value);
    return key && (key === categoryId || key === categoryText);
  });
}

async function getBrandFallbacks(): Promise<Brand[]> {
  const client = readClient();

  if (!client) {
    return [];
  }

  const homepage = await client
    .from('homepage_sections')
    .select('*')
    .like('source', 'admin-brand:%')
    .order('sort_order', {ascending: true});

  if (!homepage.error) {
    return (homepage.data ?? []).map((record) => {
      const meta = String(record.source ?? '').split(':');
      return {
        id: String(record.id ?? ''),
        name_en: String(record.title_en ?? ''),
        name_ar: String(record.title_ar ?? record.title_en ?? ''),
        logo_url: meta.slice(1).join(':') || null,
        sort_order: Number(record.sort_order ?? 0),
        is_visible: record.is_visible !== false
      };
    }).filter((brand) => brand.is_visible !== false)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  }

  const settings = await client
    .from('store_settings')
    .select('*')
    .like('id', 'admin-brand-%');

  return (settings.data ?? []).map((record) => ({
    id: String(record.id ?? ''),
    name_en: String(record.phone_sales ?? ''),
    name_ar: String(record.phone_repairs ?? record.phone_sales ?? ''),
    logo_url: typeof record.logo_url === 'string' ? record.logo_url : null,
    sort_order: Number(record.maps_url ?? 0),
    is_visible: record.instagram !== 'hidden',
    slug: typeof record.whatsapp === 'string' ? record.whatsapp : undefined
  })).filter((brand) => brand.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

function emptyCategory(id: unknown): Category {
  return {id: Number(id ?? 0), slug: '', name_en: '', name_ar: '', icon: '', sort_order: 0};
}

function productFromRecord(record: ProductRecord, brandList: Brand[], categoryList: Category[]) {
  const productImages = Array.isArray(record.product_images) ? record.product_images : [];
  const sortedProductImages = [...productImages].sort((a, b) => a.sort_order - b.sort_order);
  const imageUrls = sortedProductImages.length
    ? sortedProductImages.map((image) => image.url)
    : Array.isArray(record.image_urls)
      ? record.image_urls
      : record.image_url
        ? [record.image_url]
        : [];

  const brand = record.brand && typeof record.brand === 'object'
    ? record.brand
    : brandList.find((item) => brandMatchesRecord(item, record))
      ?? (typeof record.brand === 'string' && record.brand.trim()
        ? {id: Number(record.brand_id ?? 0), name_en: record.brand.trim(), name_ar: record.brand.trim(), logo_url: null}
        : emptyBrand(record.brand_id));
  const category = record.category && typeof record.category === 'object'
    ? record.category
    : categoryList.find((item) => categoryMatchesRecord(item, record))
      ?? (typeof record.category === 'string' && record.category.trim()
        ? {id: Number(record.category_id ?? 0), slug: record.category.trim(), name_en: record.category.trim(), name_ar: record.category.trim(), icon: '', sort_order: 0}
        : emptyCategory(record.category_id));

  return normalizeProduct({
    ...record,
    brand,
    category,
    likes: record.likes ?? 0,
    sold_count: record.sold_count ?? 0,
    rating: record.rating ?? 0,
    review_count: record.review_count ?? 0,
    image_gallery: record.data?.image_gallery ?? sortedProductImages
      .map((image) => ({url: image.url, color: image.color ?? null})),
    images: imageUrls
  } as Product);
}

async function productImagesByProductId(productIds: number[]) {
  const client = readClient();
  const byProductId = new Map<number, ProductImageRow[]>();

  if (!client || !productIds.length) {
    return byProductId;
  }

  const {data, error} = await client
    .from('product_images')
    .select('product_id, url, sort_order')
    .in('product_id', productIds);

  if (error) {
    logDataError('product_images', error);
    return byProductId;
  }

  (data ?? []).forEach((image) => {
    const row = image as ProductImageRecord;
    const productId = Number(row.product_id);
    const images = byProductId.get(productId) ?? [];
    images.push({
      url: row.url,
      color: null,
      sort_order: Number(row.sort_order ?? 0)
    });
    byProductId.set(productId, images);
  });

  return byProductId;
}

async function attachProductImages(products: ProductRecord[]) {
  const productIds = products.map((product) => Number(product.id)).filter((id) => Number.isInteger(id) && id > 0);
  const images = await productImagesByProductId(productIds);

  return products.map((product) => ({
    ...product,
    product_images: images.get(Number(product.id)) ?? []
  }));
}

export async function getSettings() {
  const client = readClient();

  if (client) {
    const {data, error} = await client
      .from('store_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();

    if (!error && data) {
      return settingsFromRecord(data, emptySettings);
    }
  }

  return emptySettings;
}

export async function getCategories() {
  const client = readClient();

  if (!client) {
    return [];
  }

  const {data, error} = await client
    .from('categories')
    .select('*')
    .order('sort_order', {ascending: true});

  if (error || !data) {
    if (error && !isMissingRelationError(error)) logDataError('categories', error);
    return [];
  }

  return data
    .map((record) => categoryFromRecord(record))
    .filter((category) => category.slug && category.is_visible !== false && category.is_active !== false)
    .sort((a, b) => (a.display_order ?? a.sort_order ?? 0) - (b.display_order ?? b.sort_order ?? 0));
}

export async function getBrands() {
  const client = readClient();

  if (!client) {
    return [];
  }

  const {data, error} = await client
    .from('brands')
    .select('*')
    .order('sort_order', {ascending: true});

  if (error || !data) {
    if (error && isMissingTableError(error)) return getBrandFallbacks();
    if (error && !isMissingRelationError(error)) logDataError('brands', error);
    return getBrandFallbacks();
  }

  return data.map((record) => brandFromRecord(record))
    .filter((brand) => brand.is_visible !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

export async function getProducts(): Promise<Product[]> {
  const client = readClient();

  if (!client) {
    return [];
  }

  const [brandList, categoryList, productResult] = await Promise.all([
    getBrands(),
    getCategories(),
    client
      .from('products')
      .select('*')
      .order('created_at', {ascending: false})
  ]);
  const {data, error} = productResult;

  if (error || !data) {
    if (error) logDataError('products', error);
    return [];
  }

  const productsWithImages = await attachProductImages(data as ProductRecord[]);

  return normalizeProducts(productsWithImages.map((product) => {
    return productFromRecord(product as ProductRecord, brandList, categoryList);
  })).filter(productIsVisible);
}

export async function getAdminProducts(): Promise<Product[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return [];
  }

  const [brandResult, categoryResult, productResult] = await Promise.all([
    supabaseAdmin.from('brands').select('*').order('sort_order', {ascending: true}),
    supabaseAdmin.from('categories').select('*').order('sort_order', {ascending: true}),
    supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', {ascending: false})
  ]);
  const {data, error} = productResult;

  if (error || brandResult.error || categoryResult.error || !data) {
    if (error) logDataError('admin-products', error);
    if (brandResult.error && !isMissingRelationError(brandResult.error)) logDataError('admin-brands', brandResult.error);
    if (categoryResult.error && !isMissingRelationError(categoryResult.error)) logDataError('admin-categories', categoryResult.error);
    return [];
  }

  const brandList = (brandResult.data ?? []).map((record) => brandFromRecord(record));
  const categoryList = (categoryResult.data ?? []).map((record) => categoryFromRecord(record));
  const productsWithImages = await attachProductImages(data as ProductRecord[]);

  return normalizeProducts(productsWithImages.map((product) => productFromRecord(product as ProductRecord, brandList, categoryList)));
}

export async function getProduct(routeKey: number | string) {
  const lookupKey = String(routeKey).trim();
  const numericId = Number(lookupKey);
  const isNumericId = Number.isInteger(numericId) && numericId > 0;

  if (!lookupKey) {
    return null;
  }

  const client = readClient();

  if (!client) {
    return null;
  }

  const [brandList, categoryList, productResult] = await Promise.all([
    getBrands(),
    getCategories(),
    isNumericId
      ? client
        .from('products')
        .select('*')
        .eq('id', numericId)
        .maybeSingle()
      : client
        .from('products')
        .select('*')
        .eq('slug', lookupKey)
        .maybeSingle()
  ]);
  const {data, error} = productResult;

  if (error || !data) {
    if (error) logDataError('product', error);
    return null;
  }

  const [productWithImages] = await attachProductImages([data as ProductRecord]);

  return productFromRecord(productWithImages as ProductRecord, brandList, categoryList);
}
