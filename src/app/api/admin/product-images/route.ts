import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

const maxImageSizeBytes = 3 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ok: false, message}, {status});
}

type TemporaryImage = {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
};

const temporaryImages = (globalThis as typeof globalThis & {
  __sevenphoneTemporaryImages?: Map<string, TemporaryImage>;
}).__sevenphoneTemporaryImages ?? new Map<string, TemporaryImage>();

(globalThis as typeof globalThis & {
  __sevenphoneTemporaryImages?: Map<string, TemporaryImage>;
}).__sevenphoneTemporaryImages = temporaryImages;

function cleanupTemporaryImages() {
  const maxAgeMs = 1000 * 60 * 60;
  const now = Date.now();

  temporaryImages.forEach((image, id) => {
    if (now - image.createdAt > maxAgeMs) {
      temporaryImages.delete(id);
    }
  });
}

function extractStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(index + marker.length));
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const replaceExisting = formData.get('replaceExisting') === 'true';
  const file = formData.get('file');

  if (!Number.isFinite(productId) || productId <= 0) {
    return jsonError('Missing valid product id.', 400);
  }

  if (!(file instanceof File)) {
    return jsonError('Missing image file.', 400);
  }

  if (!allowedTypes.has(file.type)) {
    return jsonError('Only JPG, PNG, and WEBP images are allowed.', 400);
  }

  if (file.size > maxImageSizeBytes) {
    return jsonError('Image is too large. Maximum size is 3 MB.', 400);
  }

  const extension = extensionByType[file.type];
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    cleanupTemporaryImages();
    const id = `${productId}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    temporaryImages.set(id, {
      buffer,
      contentType: file.type,
      createdAt: Date.now()
    });

    return NextResponse.json({
      ok: true,
      temporary: true,
      url: `/api/admin/product-images/temp/${id}`,
      path: id,
      message:
        'Temporary upload only. Configure Supabase Storage env vars for persistent public storage.'
    });
  }

  const storagePath = `products/${productId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const {error: uploadError} = await supabaseAdmin.storage
    .from(productImagesBucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false
    });

  if (uploadError) {
    return jsonError(uploadError.message, 500);
  }

  const {data: publicUrlData} = supabaseAdmin.storage.from(productImagesBucket).getPublicUrl(storagePath);
  const publicUrl = publicUrlData.publicUrl;

  if (replaceExisting) {
    const {data: existingImages} = await supabaseAdmin
      .from('product_images')
      .select('url')
      .eq('product_id', productId);

    const pathsToRemove = existingImages
      ?.map((image: {url: string}) => extractStoragePathFromPublicUrl(image.url))
      .filter((path): path is string => Boolean(path)) ?? [];

    if (pathsToRemove.length) {
      await supabaseAdmin.storage.from(productImagesBucket).remove(pathsToRemove);
    }

    await supabaseAdmin.from('product_images').delete().eq('product_id', productId);
  }

  let sortOrder = 0;

  if (!replaceExisting) {
    const {data: latestImage} = await supabaseAdmin
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', {ascending: false})
      .limit(1)
      .maybeSingle();

    sortOrder = Number(latestImage?.sort_order ?? -1) + 1;
  }

  const {error: insertError} = await supabaseAdmin.from('product_images').insert({
    product_id: productId,
    url: publicUrl,
    sort_order: sortOrder
  });

  if (insertError) {
    await supabaseAdmin.storage.from(productImagesBucket).remove([storagePath]);
    return jsonError(insertError.message, 500);
  }

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    path: storagePath
  });
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  const body = (await request.json().catch(() => null)) as {
    productId?: number;
    url?: string;
  } | null;

  if (!body?.productId || !body.url) {
    return jsonError('Missing product id or image URL.', 400);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    const temporaryId = body.url.split('/api/admin/product-images/temp/')[1];

    if (temporaryId) {
      temporaryImages.delete(temporaryId);
    }

    return NextResponse.json({ok: true, temporary: true});
  }

  await supabaseAdmin
    .from('product_images')
    .delete()
    .eq('product_id', body.productId)
    .eq('url', body.url);

  const storagePath = extractStoragePathFromPublicUrl(body.url);

  if (storagePath) {
    await supabaseAdmin.storage.from(productImagesBucket).remove([storagePath]);
  }

  return NextResponse.json({ok: true});
}
