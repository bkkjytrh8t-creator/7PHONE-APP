import {brands, categories, products, settings} from './seed';
import {normalizeProduct, normalizeProducts} from './productNormalize';
import {settingsFromRecord} from './settingsMap';
import {isSupabaseConfigured, supabase} from './supabase';
import type {Product} from './types';

export async function getSettings() {
  if (isSupabaseConfigured && supabase) {
    const {data, error} = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();

    if (!error && data) {
      return settingsFromRecord(data, settings);
    }
  }

  return settings;
}

export async function getCategories() {
  return categories;
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return normalizeProducts(products);
  }

  const {data, error} = await supabase
    .from('products')
    .select('*, product_images(url, sort_order)')
    .order('created_at', {ascending: false});

  if (error || !data) {
    return normalizeProducts(products);
  }

  return normalizeProducts(data.map((product) => {
    const fallbackProduct = products.find((item) => item.id === product.id);

    return {
    ...fallbackProduct,
    ...product,
    brand: product.brand ?? fallbackProduct?.brand ?? brands.find((item) => item.id === product.brand_id) ?? brands[0],
    category: product.category ?? fallbackProduct?.category ?? categories.find((item) => item.id === product.category_id) ?? categories[0],
    likes: product.likes ?? 0,
    sold_count: product.sold_count ?? 0,
    rating: product.rating ?? 0,
    review_count: product.review_count ?? 0,
    images: product.product_images
      ?.sort((a: {sort_order: number}, b: {sort_order: number}) => a.sort_order - b.sort_order)
      .map((image: {url: string}) => image.url) ?? product.image_urls ?? (product.image_url ? [product.image_url] : fallbackProduct?.images ?? [])
  };
  }) as Product[]);
}

export async function getProduct(id: number) {
  const allProducts = await getProducts();
  const product = allProducts.find((item) => item.id === id) ?? null;
  return product ? normalizeProduct(product) : null;
}
