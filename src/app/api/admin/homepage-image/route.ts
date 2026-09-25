import crypto from 'crypto';
import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, siteAssetsBucket, supabaseAdmin} from '@/lib/adminSupabase';

export const runtime = 'nodejs';
const imageMaxSize = 12 * 1024 * 1024;
const videoMaxSize = 80 * 1024 * 1024;
const types = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/avif', 'avif'], ['image/gif', 'gif'], ['image/svg+xml', 'svg'], ['video/mp4', 'mp4'], ['video/webm', 'webm']]);

function error(message: string, status = 400) { return NextResponse.json({ok: false, message}, {status}); }

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return error('Unauthorized.', 401);
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return error('Supabase admin client is not configured.', 503);
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return error('Choose a homepage image / اختر صورة للبنر.');
  const extension = types.get(file.type);
  if (!extension) return error('Media must be JPG, PNG, WEBP, AVIF, GIF, SVG, MP4, or WEBM / يجب أن يكون الملف JPG أو PNG أو WEBP أو AVIF أو GIF أو SVG أو MP4 أو WEBM.');
  const maxSize = file.type.startsWith('video/') ? videoMaxSize : imageMaxSize;
  if (!file.size || file.size > maxSize) return error(file.type.startsWith('video/') ? 'Video must be smaller than 80 MB / يجب أن يكون الفيديو أقل من 80 ميجابايت.' : 'Image must be smaller than 12 MB / يجب أن تكون الصورة أقل من 12 ميجابايت.');
  const sectionId = String(form?.get('sectionId') || 'new').replace(/[^a-zA-Z0-9_-]/g, '-');
  const path = `homepage/${sectionId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const {error: uploadError} = await supabaseAdmin.storage.from(siteAssetsBucket).upload(path, Buffer.from(await file.arrayBuffer()), {contentType: file.type, cacheControl: '31536000', upsert: false});
  if (uploadError) return error(`Storage upload failed: ${uploadError.message} / فشل رفع الصورة إلى التخزين.`);
  const {data} = supabaseAdmin.storage.from(siteAssetsBucket).getPublicUrl(path);
  if (!data.publicUrl?.startsWith('https://')) return error('Storage did not return a valid public URL / لم يُرجع التخزين رابطًا عامًا صالحًا.', 500);
  return NextResponse.json({ok: true, path, url: data.publicUrl, mediaType: file.type.startsWith('video/') ? 'video' : 'image'});
}
