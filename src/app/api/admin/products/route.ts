import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

function jsonError(message: string, status = 500) {
  return NextResponse.json({ok: false, message}, {status});
}

function logAdminError(scope: string, error: unknown) {
  console.error(`[admin-products:${scope}]`, error);
}

function numericId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalQuantity(value: unknown) {
  if (value === null || value === undefined || text(value).length === 0) {
    return null;
  }

  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
}

function textList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }

  return text(value)
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

async function requireAdmin() {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase service role client is not configured.', 503);
  }

  return null;
}

function revalidateProduct(id?: number) {
  revalidatePath('/ar');
  revalidatePath('/en');
  revalidatePath('/ar/admin/products');
  revalidatePath('/en/admin/products');

  if (id) {
    revalidatePath(`/ar/product/${id}`);
    revalidatePath(`/en/product/${id}`);
  }
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function removeProductStorageImages(productId: number) {
  if (!supabaseAdmin) return;

  const {data, error} = await supabaseAdmin
    .from('product_images')
    .select('url')
    .eq('product_id', productId);

  if (error) {
    throw new Error(`Could not load product images before delete: ${error.message}`);
  }

  const paths = (data ?? [])
    .map((image) => storagePathFromPublicUrl(String(image.url)))
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  const {error: storageError} = await supabaseAdmin.storage.from(productImagesBucket).remove(paths);

  if (storageError) {
    throw new Error(`Could not remove product image files: ${storageError.message}`);
  }
}

async function loadProducts() {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client is not configured.');
  }

  const {data, error} = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function loadCatalog() {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client is not configured.');
  }

  const [brands, categories] = await Promise.all([
    supabaseAdmin.from('brands').select('*').order('sort_order', {ascending: true}),
    supabaseAdmin.from('categories').select('*').order('sort_order', {ascending: true})
  ]);

  return {
    brands: brands.error ? [] : brands.data ?? [],
    categories: categories.error ? [] : categories.data ?? []
  };
}

async function nextProductId() {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client is not configured.');
  }

  const {data, error} = await supabaseAdmin
    .from('products')
    .select('id')
    .order('id', {ascending: false})
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not calculate next product id: ${error.message}`);
  }

  return Number(data?.id ?? 0) + 1;
}

function rowForLiveProductColumns(row: Record<string, unknown>, products: Record<string, unknown>[]) {
  const [sample] = products;

  if (!sample) {
    return row;
  }

  const columns = new Set(Object.keys(sample));
  return Object.fromEntries(Object.entries(row).filter(([key]) => columns.has(key) || key === 'id'));
}

function productRow(payload: Record<string, unknown>, brands: Record<string, unknown>[], categories: Record<string, unknown>[]) {
  const brandRecord = payload.brand && typeof payload.brand === 'object' ? payload.brand as Record<string, unknown> : null;
  const categoryRecord = payload.category && typeof payload.category === 'object' ? payload.category as Record<string, unknown> : null;
  const productId = numericId(payload.id);
  const brandId = numericId(payload.brand_id ?? brandRecord?.id);
  const categoryId = numericId(payload.category_id ?? categoryRecord?.id);
  const brand = brands.find((item) => Number(item.id) === brandId);
  const category = categories.find((item) => Number(item.id) === categoryId);
  const stockStatus = text(payload.stock_status ?? payload.status) || 'available';
  const badge = text(payload.badge) || (payload.is_offer ? 'deal' : payload.is_new ? 'new' : payload.is_featured ? 'best-seller' : 'none');
  const price = Number(payload.price_bhd ?? payload.price ?? 0);
  const oldPrice = payload.old_price_bhd || payload.old_price ? Number(payload.old_price_bhd ?? payload.old_price) : null;
  const images = textList(payload.image_urls ?? payload.images);
  const row: Record<string, unknown> = {
    name_en: text(payload.name_en),
    name_ar: text(payload.name_ar),
    description_en: text(payload.description_en),
    description_ar: text(payload.description_ar),
    price_bhd: price,
    old_price_bhd: oldPrice,
    brand_id: brandId,
    category_id: categoryId,
    condition: text(payload.condition) || 'New',
    warranty: text(payload.warranty) || '1 year',
    installments: text(payload.installments) || 'Available',
    badge,
    stock_status: stockStatus,
    status: stockStatus === 'deleted' ? 'deleted' : stockStatus,
    is_active: stockStatus !== 'hidden' && stockStatus !== 'deleted',
    storage: textList(payload.storage),
    colors: textList(payload.colors),
    specifications_en: textList(payload.specifications_en ?? payload.specs_en),
    specifications_ar: textList(payload.specifications_ar ?? payload.specs_ar),
    brand: text(brand?.name_en ?? payload.brand),
    category: text(category?.slug ?? payload.category),
    specs_en: textList(payload.specifications_en ?? payload.specs_en),
    specs_ar: textList(payload.specifications_ar ?? payload.specs_ar),
    accessories: Array.isArray(payload.accessories) ? payload.accessories : [],
    price,
    old_price: oldPrice,
    image_url: images[0] ?? (text(payload.image_url) || null),
    image_urls: images,
    is_featured: badge === 'best-seller',
    is_new: badge === 'new',
    is_offer: badge === 'deal',
    views: Number(payload.views ?? payload.sort_order ?? 0),
    likes: Number(payload.likes ?? 0),
    whatsapp_clicks: Number(payload.orders ?? payload.whatsapp_clicks ?? 0),
    sort_order: Number(payload.sort_order ?? payload.views ?? 0),
    data: {
      storage_prices: Array.isArray(payload.storage_prices) ? payload.storage_prices : [],
      comparison: payload.comparison && typeof payload.comparison === 'object' ? payload.comparison : {},
      features: textList(payload.features),
      tags: textList(payload.tags),
      ram: text(payload.ram),
      quantity: optionalQuantity(payload.quantity),
      shares: Number(payload.shares ?? 0),
      sold_count: Number(payload.sold_count ?? 0),
      rating: Number(payload.rating ?? 0),
      review_count: Number(payload.review_count ?? 0)
    }
  };

  if (productId) {
    row.id = productId;
  }

  return row;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    return NextResponse.json({ok: true, products: await loadProducts()});
  } catch (error) {
    logAdminError('GET', error);
    return jsonError(error instanceof Error ? error.message : 'Could not load products.');
  }
}

async function handleWrite(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    payload?: Record<string, unknown>;
    product?: Record<string, unknown>;
  } | null;
  const payload = body?.payload ?? body?.product;

  if (!payload || !supabaseAdmin) {
    return jsonError('Missing product payload.', 400);
  }

  try {
    const catalog = await loadCatalog();
    const currentProducts = await loadProducts();
    const row = rowForLiveProductColumns(productRow(payload, catalog.brands, catalog.categories), currentProducts);
    if (!row.id) {
      row.id = await nextProductId();
    }
    const write = row.id
      ? await supabaseAdmin.from('products').upsert(row, {onConflict: 'id'}).select('id').single()
      : await supabaseAdmin.from('products').insert(row).select('id').single();

    if (write.error || !write.data) {
      throw new Error(write.error?.message || 'Could not save product.');
    }

    revalidateProduct(Number(write.data.id));

    return NextResponse.json({ok: true, product: write.data, products: await loadProducts()});
  } catch (error) {
    logAdminError('write', error);
    return jsonError(error instanceof Error ? error.message : 'Product save failed.');
  }
}

export async function POST(request: Request) {
  return handleWrite(request);
}

export async function PUT(request: Request) {
  return handleWrite(request);
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as {productId?: number; id?: number} | null;
  const productId = numericId(body?.productId ?? body?.id);

  if (!productId || !supabaseAdmin) {
    return jsonError('Missing valid product id.', 400);
  }

  try {
    await removeProductStorageImages(productId);

    const imageDelete = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    if (imageDelete.error) {
      throw new Error(`Could not delete product_images: ${imageDelete.error.message}`);
    }

    const productDelete = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .select('id');

    if (productDelete.error) {
      throw new Error(`Could not delete product: ${productDelete.error.message}`);
    }

    if (!productDelete.data?.length) {
      return jsonError('Product was not found in Supabase. Nothing was deleted.', 404);
    }

    revalidateProduct(productId);

    return NextResponse.json({ok: true, deletedId: productId, products: await loadProducts()});
  } catch (error) {
    logAdminError('DELETE', error);
    return jsonError(error instanceof Error ? error.message : 'Product delete failed.');
  }
}
