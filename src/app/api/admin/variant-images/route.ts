import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

const allowedTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function safeSegment(value: FormDataEntryValue | null, fallback: string) {
  const cleaned = String(value ?? '').trim().replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
  return cleaned || fallback;
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ok: false, message: 'Unauthorized.'}, {status: 401});
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ok: false, message: 'Supabase is not configured.'}, {status: 503});

  const form = await request.formData();
  const productId = Number(form.get('productId'));
  const variantId = safeSegment(form.get('variantId'), 'variant');
  const files = form.getAll('files').filter((file): file is File => file instanceof File);
  if (!Number.isInteger(productId) || productId <= 0 || !files.length) return NextResponse.json({ok: false, message: 'Save the product and choose images first.'}, {status: 400});

  const urls: string[] = [];
  for (const file of files) {
    const extension = allowedTypes[file.type];
    if (!extension) return NextResponse.json({ok: false, message: 'Only JPG, PNG, and WEBP images are allowed.'}, {status: 400});
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ok: false, message: 'Maximum image size is 4 MB.'}, {status: 400});
    const path = `products/${productId}/variants/${variantId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const {error} = await supabaseAdmin.storage.from(productImagesBucket).upload(path, Buffer.from(await file.arrayBuffer()), {contentType: file.type, cacheControl: '31536000'});
    if (error) return NextResponse.json({ok: false, message: error.message}, {status: 500});
    urls.push(supabaseAdmin.storage.from(productImagesBucket).getPublicUrl(path).data.publicUrl);
  }
  return NextResponse.json({ok: true, urls});
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ok: false, message: 'Unauthorized.'}, {status: 401});
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ok: false, message: 'Supabase is not configured.'}, {status: 503});
  const body = await request.json().catch(() => null) as {url?: string} | null;
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = body?.url?.indexOf(marker) ?? -1;
  if (!body?.url || index < 0) return NextResponse.json({ok: false, message: 'Invalid variant image URL.'}, {status: 400});
  const path = decodeURIComponent(body.url.slice(index + marker.length));
  const {error} = await supabaseAdmin.storage.from(productImagesBucket).remove([path]);
  if (error) return NextResponse.json({ok: false, message: error.message}, {status: 500});
  return NextResponse.json({ok: true});
}
