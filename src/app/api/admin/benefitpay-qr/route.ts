import {randomUUID} from 'crypto';
import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, siteAssetsBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

const allowedTypes: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};
const maxFileSize = 5 * 1024 * 1024;
const directory = 'site-settings/benefitpay/';

function error(message: string, status: number) {
  return NextResponse.json({ok: false, message}, {status});
}

async function requireAdmin() {
  if (!(await hasAdminSession())) return error('Unauthorized.', 401);
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return error('Supabase admin client is not configured.', 503);
  return null;
}

function storagePath(url: string) {
  const marker = `/storage/v1/object/public/${siteAssetsBucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(url.slice(index + marker.length));
  return path.startsWith(directory) ? path : null;
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const previousUrl = String(form?.get('previousUrl') ?? '');
  if (!(file instanceof File)) return error('Choose an image to upload.', 400);
  if (!allowedTypes[file.type]) return error('Only PNG, JPG, JPEG, and WebP images are allowed.', 415);
  if (!file.size || file.size > maxFileSize) return error('The QR image must be 5 MB or smaller.', 413);

  const path = `${directory}${Date.now()}-${randomUUID()}.${allowedTypes[file.type]}`;
  const {error: uploadError} = await supabaseAdmin!.storage.from(siteAssetsBucket).upload(
    path,
    Buffer.from(await file.arrayBuffer()),
    {contentType: file.type, cacheControl: '3600', upsert: false}
  );
  if (uploadError) return error(uploadError.message, 500);

  const {data} = supabaseAdmin!.storage.from(siteAssetsBucket).getPublicUrl(path);
  const oldPath = storagePath(previousUrl);
  if (oldPath) await supabaseAdmin!.storage.from(siteAssetsBucket).remove([oldPath]);

  return NextResponse.json({ok: true, url: data.publicUrl});
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const body = await request.json().catch(() => null) as {url?: string} | null;
  const path = storagePath(String(body?.url ?? ''));
  if (!path) return NextResponse.json({ok: true});
  const {error: removeError} = await supabaseAdmin!.storage.from(siteAssetsBucket).remove([path]);
  if (removeError) return error(removeError.message, 500);
  return NextResponse.json({ok: true});
}
