import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function jsonError(message: string, status = 500) {
  return NextResponse.json({ok: false, message}, {status});
}

function logAdminError(scope: string, error: unknown) {
  console.error(`[admin-images:${scope}]`, error);
}

function productId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function revalidate(product: number) {
  revalidatePath('/ar');
  revalidatePath('/en');
  revalidatePath('/ar/admin');
  revalidatePath('/en/admin');
  revalidatePath(`/ar/product/${product}`);
  revalidatePath(`/en/product/${product}`);
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin client is not configured.', 503);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    logAdminError('POST:formData', error);
    return jsonError(error instanceof Error ? error.message : 'Could not read image upload.', 400);
  }

  const id = productId(formData.get('productId'));
  const files = formData.getAll('files');

  if (!id) {
    return jsonError('Missing product id.', 400);
  }

  const uploads = files.filter((file): file is File => file instanceof File);

  if (!uploads.length) {
    return jsonError('No files uploaded.', 400);
  }

  const uploaded: string[] = [];

  for (const file of uploads) {
    if (!allowedTypes.has(file.type)) {
      return jsonError('Only JPG, PNG, and WEBP images are allowed.', 400);
    }

    if (file.size > 4 * 1024 * 1024) {
      return jsonError('Image is too large. Maximum size is 4 MB.', 400);
    }

    const path = `products/${id}/${Date.now()}-${crypto.randomUUID()}.${extensionByType[file.type]}`;
    const {error: uploadError} = await supabaseAdmin.storage
      .from(productImagesBucket)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false
      });

    if (uploadError) {
      logAdminError('POST:storage-upload', uploadError);
      return jsonError(uploadError.message);
    }

    const {data} = supabaseAdmin.storage.from(productImagesBucket).getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }

  const {data: latest} = await supabaseAdmin
    .from('product_images')
    .select('sort_order')
    .eq('product_id', id)
    .order('sort_order', {ascending: false})
    .limit(1)
    .maybeSingle();
  const start = Number(latest?.sort_order ?? -1) + 1;
  const {error: insertError} = await supabaseAdmin.from('product_images').insert(uploaded.map((url, index) => ({
    product_id: id,
    url,
    sort_order: start + index
  })));

  if (insertError) {
    logAdminError('POST:insert', insertError);
    return jsonError(insertError.message);
  }

  revalidate(id);
  return NextResponse.json({ok: true, urls: uploaded});
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin client is not configured.', 503);
  }

  const body = (await request.json().catch(() => null)) as {id?: number; productId?: number} | null;
  const imageId = productId(body?.id);
  const id = productId(body?.productId);

  if (!imageId || !id) {
    return jsonError('Missing image id or product id.', 400);
  }

  const {data: image, error: readError} = await supabaseAdmin
    .from('product_images')
    .select('url')
    .eq('id', imageId)
    .eq('product_id', id)
    .maybeSingle();

  if (readError) {
    logAdminError('DELETE:read', readError);
    return jsonError(readError.message);
  }

  const {error} = await supabaseAdmin.from('product_images').delete().eq('id', imageId).eq('product_id', id);

  if (error) {
    logAdminError('DELETE:row', error);
    return jsonError(error.message);
  }

  const path = image?.url ? storagePathFromPublicUrl(String(image.url)) : null;
  if (path) {
    const {error: storageError} = await supabaseAdmin.storage.from(productImagesBucket).remove([path]);
    if (storageError) {
      logAdminError('DELETE:storage', storageError);
      return jsonError(storageError.message);
    }
  }

  revalidate(id);
  return NextResponse.json({ok: true});
}
