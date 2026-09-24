import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, siteAssetsBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

const maxLogoSize = 2 * 1024 * 1024;
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/svg+xml', 'svg']
]);

function jsonError(message: string, status = 500) {
  return NextResponse.json({ok: false, message}, {status});
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${siteAssetsBucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
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

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  const brandId = String(formData?.get('brandId') ?? 'new').replace(/[^a-zA-Z0-9_-]/g, '-');

  if (!(file instanceof File)) {
    return jsonError('Choose a logo image.', 400);
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return jsonError('Logo must be JPG, PNG, WEBP, or SVG.', 400);
  }

  if (file.size > maxLogoSize) {
    return jsonError('Logo is too large. Maximum size is 2 MB.', 400);
  }

  const path = `brands/${brandId || 'new'}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const {error} = await supabaseAdmin!.storage
    .from(siteAssetsBucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false
    });

  if (error) {
    return jsonError(error.message);
  }

  const {data} = supabaseAdmin!.storage.from(siteAssetsBucket).getPublicUrl(path);
  return NextResponse.json({ok: true, path, url: data.publicUrl});
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as {url?: string} | null;
  const path = body?.url ? storagePathFromPublicUrl(String(body.url)) : null;

  if (path) {
    const {error} = await supabaseAdmin!.storage.from(siteAssetsBucket).remove([path]);
    if (error) {
      return jsonError(error.message);
    }
  }

  return NextResponse.json({ok: true});
}
