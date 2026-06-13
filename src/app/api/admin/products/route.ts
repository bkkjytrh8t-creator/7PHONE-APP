import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';
import {normalizeProduct, primaryProductImage} from '@/lib/productNormalize';
import type {Product} from '@/lib/types';

export const runtime = 'nodejs';

function jsonError(message: string, status: number) {
  return NextResponse.json({ok: false, message}, {status});
}

function productRow(product: Product) {
  const imageUrl = primaryProductImage(product);

  return {
    id: product.id,
    name_en: product.name_en,
    name_ar: product.name_ar,
    brand: product.brand.name_en,
    category: product.category.slug,
    description_en: product.description_en,
    description_ar: product.description_ar,
    specs_en: product.specifications_en,
    specs_ar: product.specifications_ar,
    accessories: product.accessories,
    price: product.price_bhd,
    old_price: product.old_price_bhd,
    image_url: imageUrl || null,
    image_urls: imageUrl ? [imageUrl] : [],
    status: product.stock_status,
    is_featured: product.badge === 'best-seller',
    is_new: product.badge === 'new',
    is_offer: product.badge === 'deal',
    views: product.views,
    likes: product.likes,
    whatsapp_clicks: product.orders,
    sort_order: product.views,
    data: {
      storage_prices: product.storage_prices,
      comparison: product.comparison,
      condition: product.condition,
      warranty: product.warranty,
      installments: product.installments,
      shares: product.shares,
      sold_count: product.sold_count,
      rating: product.rating,
      review_count: product.review_count,
      storage: product.storage,
      colors: product.colors
    }
  };
}

async function syncMainImage(product: Product) {
  const imageUrl = primaryProductImage(product);

  if (!imageUrl || imageUrl.startsWith('data:') || !supabaseAdmin) {
    return;
  }

  await supabaseAdmin.from('product_images').delete().eq('product_id', product.id);
  await supabaseAdmin.from('product_images').insert({
    product_id: product.id,
    url: imageUrl,
    sort_order: 0
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin database is not configured.', 503);
  }

  const body = (await request.json().catch(() => null)) as {product?: Product} | null;

  if (!body?.product) {
    return jsonError('Missing product payload.', 400);
  }

  const product = normalizeProduct(body.product);
  const {error} = await supabaseAdmin
    .from('products')
    .upsert(productRow(product), {onConflict: 'id'});

  if (error) {
    return jsonError(error.message, 500);
  }

  await syncMainImage(product);

  return NextResponse.json({ok: true, product});
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin database is not configured.', 503);
  }

  const body = (await request.json().catch(() => null)) as {productId?: number} | null;

  if (!body?.productId) {
    return jsonError('Missing product id.', 400);
  }

  const {error} = await supabaseAdmin
    .from('products')
    .update({is_active: false, stock_status: 'deleted'})
    .eq('id', body.productId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ok: true, bucket: productImagesBucket});
}
