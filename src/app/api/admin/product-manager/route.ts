import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';
import {parseProductVideoUrl} from '@/lib/productMedia';
import {sanitizeProductContentBlocks} from '@/lib/productContent';

export const runtime = 'nodejs';

function jsonError(message: string, status = 500) {
  return NextResponse.json({ok: false, message}, {status});
}

function logAdminError(scope: string, error: unknown) {
  console.error(`[admin-product-manager:${scope}]`, error);
}

function numericId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
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

function jsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isMissingTableError(error: {message?: string; code?: string} | null) {
  return Boolean(error?.message?.includes('schema cache') || error?.code === 'PGRST205' || error?.code === '42P01');
}

async function loadCatalogFallback(kind: 'category' | 'brand') {
  if (!supabaseAdmin) return [];
  const homepage = await supabaseAdmin
    .from('homepage_sections')
    .select('*')
    .like('source', `admin-${kind}:%`)
    .order('sort_order', {ascending: true});

  if (!homepage.error) {
    return (homepage.data ?? []).map((row) => {
      const meta = String(row.source ?? '').split(':');
      return {
        id: row.id,
        name_en: row.title_en,
        name_ar: row.title_ar,
        slug: kind === 'category' ? meta[1] ?? row.id : undefined,
        icon: kind === 'category' ? meta.slice(2).join(':') : undefined,
        logo_url: kind === 'brand' ? meta.slice(1).join(':') : undefined,
        sort_order: row.sort_order,
        is_visible: row.is_visible
      };
    });
  }

  const settings = await supabaseAdmin
    .from('store_settings')
    .select('*')
    .like('id', `admin-${kind}-%`);

  return (settings.data ?? []).map((row) => {
    return {
      id: row.id,
      name_en: row.phone_sales ?? '',
      name_ar: row.phone_repairs ?? '',
      slug: kind === 'category' ? row.whatsapp ?? '' : undefined,
      ...(kind === 'brand' ? {slug: row.whatsapp ?? ''} : {}),
      icon: kind === 'category' ? row.logo_url ?? '' : undefined,
      logo_url: kind === 'brand' ? row.logo_url ?? '' : undefined,
      sort_order: Number(row.maps_url ?? 0),
      is_visible: row.instagram !== 'hidden'
    };
  });
}

function recordList(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[] : [];
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === '1';
}

async function requireAdmin() {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin client is not configured.', 503);
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
    throw new Error(error.message);
  }

  const paths = (data ?? [])
    .map((image) => storagePathFromPublicUrl(String(image.url)))
    .filter((path): path is string => Boolean(path));

  if (paths.length) {
    const {error: storageError} = await supabaseAdmin.storage.from(productImagesBucket).remove(paths);
    if (storageError) {
      throw new Error(storageError.message);
    }
  }
}

async function deleteProductFully(productId: number) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured.');
  }

  await removeProductStorageImages(productId);

  const images = await supabaseAdmin.from('product_images').delete().eq('product_id', productId);
  if (images.error) throw new Error(images.error.message);

  const product = await supabaseAdmin.from('products').delete().eq('id', productId).select('id');
  if (product.error) throw new Error(product.error.message);
  if (!product.data?.length) throw new Error('Product was not found in Supabase.');

  revalidateProduct(productId);
}

async function loadProductManagerData() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured.');
  }

  const [products, categories, brands] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', {ascending: false}),
    supabaseAdmin.from('categories').select('*').order('sort_order', {ascending: true}),
    supabaseAdmin.from('brands').select('*').order('sort_order', {ascending: true})
  ]);

  if (products.error) {
    throw new Error(products.error.message);
  }

  const productRows = products.data ?? [];
  const productIds = productRows.map((product) => Number(product.id)).filter((id) => Number.isInteger(id) && id > 0);
  let productImagesById = new Map<number, Record<string, unknown>[]>();

  if (productIds.length) {
    const {data: productImages, error: productImagesError} = await supabaseAdmin
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', {ascending: true});

    if (!productImagesError) {
      productImagesById = (productImages ?? []).reduce((map, image) => {
        const productId = Number(image.product_id);
        const images = map.get(productId) ?? [];
        images.push(image);
        map.set(productId, images);
        return map;
      }, new Map<number, Record<string, unknown>[]>());
    }
  }

  return {
    products: productRows.map((product) => ({
      ...product,
      product_images: productImagesById.get(Number(product.id)) ?? []
    })),
    categories: categories.error ? isMissingTableError(categories.error) ? await loadCatalogFallback('category') : [] : categories.data ?? [],
    brands: brands.error ? isMissingTableError(brands.error) ? await loadCatalogFallback('brand') : [] : brands.data ?? []
  };
}

async function nextProductId() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured.');
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

async function duplicateProduct(productId: number) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured.');
  }

  const {data: product, error} = await supabaseAdmin.from('products').select('*').eq('id', productId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!product) throw new Error('Product was not found.');

  const newId = await nextProductId();
  const data = jsonObject(product.data);
  const row = {
    ...product,
    id: newId,
    name_en: `${text(product.name_en)} Copy`.trim(),
    name_ar: `${text(product.name_ar)} نسخة`.trim(),
    status: 'draft',
    stock_status: 'hidden',
    is_active: false,
    created_at: undefined,
    data: {
      ...data,
      sku: data.sku ? `${data.sku}-COPY` : '',
      slug: data.slug ? `${data.slug}-copy-${newId}` : ''
    }
  };

  delete (row as Record<string, unknown>).created_at;
  const {error: insertError} = await supabaseAdmin.from('products').insert(row);
  if (insertError) throw new Error(insertError.message);

  const {data: images, error: imagesError} = await supabaseAdmin.from('product_images').select('url, color, sort_order').eq('product_id', productId);
  if (imagesError) throw new Error(imagesError.message);

  if (images?.length) {
    const {error: imageInsertError} = await supabaseAdmin.from('product_images').insert(images.map((image) => ({
      product_id: newId,
      url: image.url,
      color: image.color,
      sort_order: image.sort_order
    })));
    if (imageInsertError) throw new Error(imageInsertError.message);
  }

  revalidateProduct(newId);
  return newId;
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
  const productId = numericId(payload.id);
  const brandId = numericId(payload.brand_id);
  const categoryId = numericId(payload.category_id);
  const rawBrandId = text(payload.brand_id);
  const rawCategoryId = text(payload.category_id);
  const brand = brands.find((item) => Number(item.id) === brandId || String(item.id) === rawBrandId);
  const category = categories.find((item) => Number(item.id) === categoryId || String(item.id) === rawCategoryId);
  const badge = text(payload.badge) || 'none';
  const stockStatus = text(payload.stock_status) || 'available';
  const publicationStatus = text(payload.publication_status) || (stockStatus === 'deleted' ? 'archived' : stockStatus === 'hidden' ? 'draft' : 'published');
  const price = money(payload.price_bhd);
  const oldPrice = payload.old_price_bhd ? money(payload.old_price_bhd) : null;
  const variants = recordList(payload.variants).map((variant, index) => ({
    id: text(variant.id) || `variant-${index + 1}`,
    color: text(variant.color),
    color_en: text(variant.color_en) || text(variant.color),
    color_ar: text(variant.color_ar),
    color_hex: text(variant.color_hex),
    storage: text(variant.storage),
    ram: text(variant.ram),
    warranty: text(variant.warranty),
    price_bhd: money(variant.price_bhd),
    old_price_bhd: variant.old_price_bhd ? money(variant.old_price_bhd) : null,
    stock: optionalQuantity(variant.stock) ?? 0,
    sku: text(variant.sku),
    available: variant.available === undefined ? true : bool(variant.available),
    is_default: bool(variant.is_default),
    most_popular: bool(variant.most_popular),
    images: textList(variant.images)
  }));
  const combinationKeys = variants.map((variant) => [variant.color_en, variant.storage, variant.ram].map((value) => value.toLowerCase()).join('|'));
  const variantSkus = variants.map((variant) => variant.sku.toLowerCase()).filter(Boolean);
  if (new Set(combinationKeys).size !== combinationKeys.length || new Set(variantSkus).size !== variantSkus.length) {
    throw new Error('Variant combinations and SKUs must be unique.');
  }
  const requestedDefaults = variants.filter((variant) => variant.is_default);
  if (requestedDefaults.length > 1) {
    throw new Error('Only one default variant is allowed.');
  }
  const storagePrices = variants
    .filter((variant) => variant.storage && variant.price_bhd !== null)
    .map((variant) => ({label: variant.storage, price_bhd: variant.price_bhd as number}));
  const mediaGallery = recordList(payload.media_gallery).map((media, index) => {
    const mediaType = text(media.media_type) === 'video' ? 'video' : 'image';
    const url = text(media.url);
    if (!url) throw new Error('Media URL is required.');
    if (mediaType === 'video') {
      const parsed = parseProductVideoUrl(url);
      if (!parsed) throw new Error('Invalid or unsupported video URL.');
      return {
        id: text(media.id) || `video-${index + 1}`,
        product_id: productId,
        media_type: 'video',
        source_type: parsed.source_type,
        url: parsed.url,
        thumbnail_url: text(media.thumbnail_url) || parsed.thumbnail_url,
        sort_order: index,
        is_primary: false,
        status: 'active',
        created_at: text(media.created_at) || new Date().toISOString()
      };
    }
    return {
      id: text(media.id) || `image-${index + 1}`,
      product_id: productId,
      media_type: 'image',
      source_type: text(media.source_type) === 'upload' ? 'upload' : 'external_url',
      url,
      thumbnail_url: text(media.thumbnail_url) || url,
      sort_order: index,
      is_primary: bool(media.is_primary),
      color: text(media.color) || null,
      status: 'active',
      image_id: numericId(media.image_id)
    };
  });
  const firstImageIndex = mediaGallery.findIndex((media) => media.media_type === 'image');
  if (firstImageIndex >= 0 && !mediaGallery.some((media) => media.media_type === 'image' && media.is_primary)) {
    mediaGallery[firstImageIndex].is_primary = true;
  }
  mediaGallery.forEach((media, index) => {
    media.sort_order = index;
    if (media.media_type === 'video') media.is_primary = false;
  });
  const primaryMediaIndex = mediaGallery.findIndex((media) => media.media_type === 'image' && media.is_primary);
  if (primaryMediaIndex > 0) mediaGallery.unshift(mediaGallery.splice(primaryMediaIndex, 1)[0]);
  mediaGallery.forEach((media, index) => { media.sort_order = index; });

  if (!text(payload.name_en) && !text(payload.name_ar)) {
    throw new Error('Enter at least one product name.');
  }

  if (price === null || price <= 0) {
    throw new Error('Enter a valid product price greater than zero.');
  }

  if (oldPrice !== null && oldPrice < price) {
    throw new Error('Old price must be empty or greater than the current price.');
  }

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
    status: publicationStatus === 'archived' ? 'deleted' : publicationStatus,
    is_active: publicationStatus === 'published' && stockStatus !== 'hidden' && stockStatus !== 'deleted',
    storage: textList(payload.storage),
    colors: textList(payload.colors),
    specifications_en: textList(payload.specifications_en),
    specifications_ar: textList(payload.specifications_ar),
    brand: text(brand?.name_en) || text(payload.brand),
    category: text(category?.slug) || text(category?.name_en) || text(payload.category),
    specs_en: textList(payload.specifications_en),
    specs_ar: textList(payload.specifications_ar),
    accessories: Array.isArray(payload.accessories) ? payload.accessories : [],
    price,
    old_price: oldPrice,
    image_urls: textList(payload.image_urls),
    image_url: textList(payload.image_urls)[0] ?? null,
    is_featured: bool(payload.is_featured) || badge === 'best-seller',
    is_new: bool(payload.is_new) || badge === 'new',
    is_offer: bool(payload.is_offer) || badge === 'deal',
    views: Number(payload.views ?? 0) || 0,
    whatsapp_clicks: Number(payload.whatsapp_clicks ?? 0) || 0,
    sort_order: Number(payload.sort_order ?? 0) || 0,
    data: {
      ...jsonObject(payload.data),
      features: textList(payload.features),
      tags: textList(payload.tags),
      short_description_en: text(payload.short_description_en),
      short_description_ar: text(payload.short_description_ar),
      details_specifications: textList(payload.details_specifications),
      box_contents: textList(payload.box_contents),
      warranty_details: text(payload.warranty_details),
      additional_notes: text(payload.additional_notes),
      hero_banner_image_url: text(payload.hero_banner_image_url),
      media_gallery: mediaGallery,
      product_content_blocks: sanitizeProductContentBlocks(payload.product_content_blocks),
      storage: textList(payload.storage),
      color_options: (Array.isArray(payload.color_options) ? payload.color_options : []).flatMap((item) => {
        const option = jsonObject(item);
        const name = text(option.name);
        const hex = /^#[0-9a-f]{6}$/i.test(text(option.hex)) ? text(option.hex) : '#d4d4d8';
        return name ? [{name, hex}] : [];
      }),
      ram: text(payload.ram),
      sku: text(payload.sku),
      internal_code: text(payload.internal_code),
      quantity: optionalQuantity(payload.quantity),
      low_stock_alert: Number(payload.low_stock_alert ?? 0) || 0,
      cost_price_bhd: payload.cost_price_bhd ? money(payload.cost_price_bhd) : null,
      dealer_price_bhd: payload.dealer_price_bhd ? money(payload.dealer_price_bhd) : null,
      tax_percent: Number(payload.tax_percent ?? 0) || 0,
      model: text(payload.model),
      barcode: text(payload.barcode),
      currency: text(payload.currency) || 'BHD',
      slug: text(payload.slug),
      slug_history: textList(payload.slug_history),
      meta_title: text(payload.meta_title),
      meta_description: text(payload.meta_description),
      publication_status: publicationStatus,
      brand_id: rawBrandId,
      category_id: rawCategoryId,
      brand: text(brand?.name_en) || text(payload.brand),
      category: text(category?.slug) || text(category?.name_en) || text(payload.category),
      is_featured: bool(payload.is_featured) || badge === 'best-seller',
      is_new: bool(payload.is_new) || badge === 'new',
      is_offer: bool(payload.is_offer) || badge === 'deal',
      is_trending: bool(payload.is_trending),
      variants_enabled: bool(payload.variants_enabled),
      variants,
      storage_prices: storagePrices
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
    return NextResponse.json({ok: true, data: await loadProductManagerData()});
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
  } | null;

  if (!body?.action || !supabaseAdmin) {
    return jsonError('Invalid product manager action.', 400);
  }

  try {
    let savedProductId: number | null = null;

    if (body.action === 'saveProduct') {
      const current = await loadProductManagerData();
      const payload = body.payload ?? {};
      const row = rowForLiveProductColumns(productRow(payload, current.brands, current.categories), current.products);
      const sku = text(payload.sku);
      const productId = numericId(payload.id);
      if (sku) {
        const duplicate = current.products.find((product) => {
          const productData = jsonObject(product.data);
          return text(productData.sku).toLowerCase() === sku.toLowerCase() && Number(product.id) !== Number(productId);
        });
        if (duplicate) {
          throw new Error('A product with this SKU already exists.');
        }
      }
      const incomingVariantSkus = recordList(payload.variants).map((variant) => text(variant.sku).toLowerCase()).filter(Boolean);
      if (incomingVariantSkus.length) {
        const existingVariantSkus = current.products
          .filter((product) => Number(product.id) !== Number(productId))
          .flatMap((product) => recordList(jsonObject(product.data).variants).map((variant) => text(variant.sku).toLowerCase()))
          .filter(Boolean);
        const conflict = incomingVariantSkus.find((variantSku) => existingVariantSkus.includes(variantSku));
        if (conflict) throw new Error(`Variant SKU already exists: ${conflict}`);
      }
      if (!row.id) {
        row.id = await nextProductId();
      }
      const query = row.id
        ? supabaseAdmin.from('products').upsert(row, {onConflict: 'id'}).select('id').single()
        : supabaseAdmin.from('products').insert(row).select('id').single();
      const {data, error} = await query;

      if (error || !data) {
        throw new Error(error?.message || 'Product save failed.');
      }

      savedProductId = Number(data.id);
      revalidateProduct(savedProductId);
    }

    if (body.action === 'archiveProduct') {
      const id = numericId(body.payload?.id);
      if (!id) throw new Error('Missing product id.');
      const {data: currentProduct, error: readError} = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
      if (readError) throw new Error(readError.message);
      const update: Record<string, unknown> = {};

      if (currentProduct && 'is_active' in currentProduct) update.is_active = false;
      if (currentProduct && 'status' in currentProduct) update.status = 'deleted';
      if (currentProduct && 'stock_status' in currentProduct) update.stock_status = 'deleted';

      if (!Object.keys(update).length) {
        throw new Error('No archive columns exist on products table.');
      }

      const {error} = await supabaseAdmin
        .from('products')
        .update(update)
        .eq('id', id);

      if (error) throw new Error(error.message);
      revalidateProduct(id);
    }

    if (body.action === 'restoreProduct') {
      const id = numericId(body.payload?.id);
      if (!id) throw new Error('Missing product id.');
      const {data: currentProduct, error: readError} = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
      if (readError) throw new Error(readError.message);
      const update: Record<string, unknown> = {};

      if (currentProduct && 'is_active' in currentProduct) update.is_active = true;
      if (currentProduct && 'status' in currentProduct) update.status = 'published';
      if (currentProduct && 'stock_status' in currentProduct) update.stock_status = 'available';

      if (!Object.keys(update).length) {
        throw new Error('No restore columns exist on products table.');
      }

      const {error} = await supabaseAdmin
        .from('products')
        .update(update)
        .eq('id', id);
      if (error) throw new Error(error.message);
      revalidateProduct(id);
    }

    if (body.action === 'duplicateProduct') {
      const id = numericId(body.payload?.id);
      if (!id) throw new Error('Missing product id.');
      savedProductId = await duplicateProduct(id);
    }

    if (body.action === 'bulkArchive' || body.action === 'bulkRestore') {
      const ids = Array.isArray(body.payload?.ids) ? body.payload.ids.map(numericId).filter((id): id is number => Boolean(id)) : [];
      if (!ids.length) throw new Error('Select at least one product.');
      const update = body.action === 'bulkRestore'
        ? {is_active: true, status: 'published', stock_status: 'available'}
        : {is_active: false, status: 'deleted', stock_status: 'deleted'};
      const {error} = await supabaseAdmin.from('products').update(update).in('id', ids);
      if (error) throw new Error(error.message);
      ids.forEach((id) => revalidateProduct(id));
    }

    if (body.action === 'bulkDelete') {
      const ids = Array.isArray(body.payload?.ids) ? body.payload.ids.map(numericId).filter((id): id is number => Boolean(id)) : [];
      if (!ids.length) throw new Error('Select at least one product.');
      for (const id of ids) {
        await deleteProductFully(id);
      }
    }

    if (body.action === 'addExternalImage') {
      const id = numericId(body.payload?.id);
      const url = text(body.payload?.url);
      if (!id || !url) throw new Error('Missing product id or image URL.');
      const {data: latest} = await supabaseAdmin
        .from('product_images')
        .select('sort_order')
        .eq('product_id', id)
        .order('sort_order', {ascending: false})
        .limit(1)
        .maybeSingle();
      const {error} = await supabaseAdmin.from('product_images').insert({
        product_id: id,
        url,
        sort_order: Number(latest?.sort_order ?? -1) + 1
      });
      if (error) throw new Error(error.message);
      revalidateProduct(id);
    }

    if (body.action === 'reorderImages') {
      const id = numericId(body.payload?.id);
      const imageIds = Array.isArray(body.payload?.imageIds) ? body.payload.imageIds.map(numericId).filter((imageId): imageId is number => Boolean(imageId)) : [];
      if (!id || !imageIds.length) throw new Error('Missing product id or image order.');
      for (const [sortOrder, imageId] of imageIds.entries()) {
        const {error} = await supabaseAdmin.from('product_images').update({sort_order: sortOrder}).eq('product_id', id).eq('id', imageId);
        if (error) throw new Error(error.message);
      }
      revalidateProduct(id);
    }

    if (body.action === 'deleteProduct') {
      const id = numericId(body.payload?.id);
      if (!id) throw new Error('Missing product id.');
      const {data: currentProduct, error: readError} = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
      if (readError) throw new Error(readError.message);
      if (!currentProduct) throw new Error('Product was not found in Supabase.');
      const currentData = jsonObject(currentProduct.data);
      const isArchived = currentProduct.status === 'deleted' || currentProduct.stock_status === 'deleted' || currentData.publication_status === 'archived';
      if (!isArchived) {
        throw new Error('Archive the product before permanent delete.');
      }

      await deleteProductFully(id);
    }

    return NextResponse.json({ok: true, data: {...(await loadProductManagerData()), savedProductId}});
  } catch (error) {
    logAdminError(String(body.action), error);
    return jsonError(error instanceof Error ? error.message : 'Product action failed.');
  }
}

export async function POST(request: Request) {
  return handleWrite(request);
}

export async function PUT(request: Request) {
  return handleWrite(request);
}
