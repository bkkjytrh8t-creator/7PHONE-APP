import {categories, products, settings} from './seed';
import {isSupabaseConfigured, supabase} from './supabase';
import type {Product} from './types';

export async function getSettings() {
  return settings;
}

export async function getCategories() {
  return categories;
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return products;
  }

  const {data, error} = await supabase
    .from('products')
    .select(
      '*, brand:brands(*), category:categories(*), product_images(url, sort_order)'
    )
    .eq('is_active', true)
    .order('created_at', {ascending: false});

  if (error || !data) {
    return products;
  }

  return data.map((product) => ({
    ...product,
    likes: product.likes ?? 0,
    sold_count: product.sold_count ?? 0,
    rating: product.rating ?? 0,
    review_count: product.review_count ?? 0,
    images: product.product_images
      ?.sort((a: {sort_order: number}, b: {sort_order: number}) => a.sort_order - b.sort_order)
      .map((image: {url: string}) => image.url) ?? []
  })) as Product[];
}

export async function getProduct(id: number) {
  const allProducts = await getProducts();
  return allProducts.find((product) => product.id === id) ?? null;
}
