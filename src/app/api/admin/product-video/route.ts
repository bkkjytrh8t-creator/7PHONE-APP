import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ok: false, message: 'Unauthorized.'}, {status: 401});
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ok: false, message: 'Storage is unavailable.'}, {status: 503});
  const body = await request.json().catch(() => null) as {productId?: unknown; type?: unknown; size?: unknown} | null;
  const productId = Number(body?.productId);
  const type = String(body?.type ?? '');
  const size = Number(body?.size);
  if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(size)) return NextResponse.json({ok: false, message: 'Invalid upload.'}, {status: 400});
  if (!['video/mp4', 'video/webm'].includes(type)) return NextResponse.json({ok: false, message: 'Only MP4 and WebM videos are supported.'}, {status: 415});
  if (size > 50 * 1024 * 1024) return NextResponse.json({ok: false, message: 'Maximum video size is 50 MB.'}, {status: 413});
  const extension = type === 'video/webm' ? 'webm' : 'mp4';
  const path = `products/${productId}/videos/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const signed = await supabaseAdmin.storage.from(productImagesBucket).createSignedUploadUrl(path);
  if (signed.error) return NextResponse.json({ok: false, message: signed.error.message}, {status: 500});
  const {data: publicData} = supabaseAdmin.storage.from(productImagesBucket).getPublicUrl(path);
  return NextResponse.json({ok: true, path, signedUrl: signed.data.signedUrl, publicUrl: publicData.publicUrl});
}
