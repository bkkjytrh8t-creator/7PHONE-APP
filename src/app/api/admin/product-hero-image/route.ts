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

function numericProductId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

function revalidateProduct(id: number) {
  revalidatePath('/ar');
  revalidatePath('/en');
  revalidatePath('/ar/admin/products');
  revalidatePath('/en/admin/products');
  revalidatePath(`/ar/product/${id}`);
  revalidatePath(`/en/product/${id}`);
}

async function requireAdmin() {
  if (!(await hasAdminSession())) return jsonError('Unauthorized.', 401);
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return jsonError('Supabase admin client is not configured.', 503);
  return null;
}

async function productData(id: number) {
  if (!supabaseAdmin) return null;
  const {data, error} = await supabaseAdmin.from('products').select('data').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.data && typeof data.data === 'object' && !Array.isArray(data.data)
    ? data.data as Record<string, unknown>
    : {};
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const id = numericProductId(formData.get('productId'));
    const file = formData.get('file');
    if (!id || !(file instanceof File)) return jsonError('Missing product id or image.', 400);
    if (!allowedTypes.has(file.type)) return jsonError('Only JPG, PNG, and WEBP images are allowed.', 400);
    if (file.size > 6 * 1024 * 1024) return jsonError('Image is too large. Maximum size is 6 MB.', 400);

    const currentData = await productData(id);
    if (!currentData) return jsonError('Product was not found.', 404);
    const oldUrl = typeof currentData.hero_banner_image_url === 'string' ? currentData.hero_banner_image_url : '';
    const path = `products/${id}/hero/${Date.now()}-${crypto.randomUUID()}.${extensionByType[file.type]}`;
    const {error: uploadError} = await supabaseAdmin!.storage
      .from(productImagesBucket)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false
      });
    if (uploadError) return jsonError(uploadError.message);

    const {data: publicData} = supabaseAdmin!.storage.from(productImagesBucket).getPublicUrl(path);
    const url = publicData.publicUrl;
    const {error: updateError} = await supabaseAdmin!.from('products').update({
      data: {...currentData, hero_banner_image_url: url}
    }).eq('id', id);
    if (updateError) {
      await supabaseAdmin!.storage.from(productImagesBucket).remove([path]);
      return jsonError(updateError.message);
    }

    const oldPath = oldUrl ? storagePathFromPublicUrl(oldUrl) : null;
    if (oldPath) await supabaseAdmin!.storage.from(productImagesBucket).remove([oldPath]);
    revalidateProduct(id);
    return NextResponse.json({ok: true, url});
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Hero image upload failed.');
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => null) as {productId?: unknown} | null;
    const id = numericProductId(body?.productId);
    if (!id) return jsonError('Missing product id.', 400);
    const currentData = await productData(id);
    if (!currentData) return jsonError('Product was not found.', 404);
    const oldUrl = typeof currentData.hero_banner_image_url === 'string' ? currentData.hero_banner_image_url : '';
    const {hero_banner_image_url: _removed, ...nextData} = currentData;
    const {error} = await supabaseAdmin!.from('products').update({data: nextData}).eq('id', id);
    if (error) return jsonError(error.message);
    const oldPath = oldUrl ? storagePathFromPublicUrl(oldUrl) : null;
    if (oldPath) await supabaseAdmin!.storage.from(productImagesBucket).remove([oldPath]);
    revalidateProduct(id);
    return NextResponse.json({ok: true});
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Hero image delete failed.');
  }
}
