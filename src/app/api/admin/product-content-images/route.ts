import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';
import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';
import {sanitizeProductContentBlocks, safeContentUrl} from '@/lib/productContent';

export const runtime = 'nodejs';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'],
  ['image/avif', 'avif'], ['image/gif', 'gif']
]);
const maxBytes = 15 * 1024 * 1024;

function privateAddress(address: string) {
  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) || parts[0] >= 224;
  }
  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

async function assertPublicUrl(source: string) {
  const safe = safeContentUrl(source);
  if (!safe) throw new Error('Invalid external image URL.');
  const url = new URL(safe);
  if (url.hostname === 'localhost' || net.isIP(url.hostname) && privateAddress(url.hostname)) throw new Error('Private image hosts are not allowed.');
  const addresses = await dns.lookup(url.hostname, {all: true});
  if (!addresses.length || addresses.some((entry) => privateAddress(entry.address))) throw new Error('Private image hosts are not allowed.');
  return safe;
}

async function importImage(productId: number, source: string) {
  if (!supabaseAdmin) throw new Error('Supabase admin client is not configured.');
  if (source.includes(`/storage/v1/object/public/${productImagesBucket}/`)) return source;
  const safe = await assertPublicUrl(source);
  const response = await fetch(safe, {redirect: 'follow', signal: AbortSignal.timeout(15000), headers: {'User-Agent': '7Phone Product Content Importer/1.0', Accept: 'image/jpeg,image/png,image/webp,image/avif,image/gif'}});
  if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}.`);
  await assertPublicUrl(response.url);
  const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  const extension = allowedTypes.get(mime);
  if (!extension) throw new Error(`Unsupported image type: ${mime || 'unknown'}.`);
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > maxBytes) throw new Error('External image is larger than 15 MB.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxBytes) throw new Error('External image is empty or larger than 15 MB.');
  const path = `product-content/${productId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const {error} = await supabaseAdmin.storage.from(productImagesBucket).upload(path, bytes, {contentType: mime, cacheControl: '31536000', upsert: false});
  if (error) throw new Error(error.message);
  return supabaseAdmin.storage.from(productImagesBucket).getPublicUrl(path).data.publicUrl;
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ok: false, message: 'Unauthorized.'}, {status: 401});
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return NextResponse.json({ok: false, message: 'Supabase admin client is not configured.'}, {status: 503});
  const body = await request.json().catch(() => null) as {productId?: unknown; blocks?: unknown} | null;
  const productId = Number(body?.productId);
  if (!Number.isInteger(productId) || productId <= 0) return NextResponse.json({ok: false, message: 'Save the product before importing external images.'}, {status: 400});
  const {data: product, error: productError} = await supabaseAdmin.from('products').select('id').eq('id', productId).maybeSingle();
  if (productError || !product) return NextResponse.json({ok: false, message: 'Product was not found.'}, {status: 404});
  try {
    const blocks = sanitizeProductContentBlocks(body?.blocks);
    const imported = new Map<string, string>();
    const failed: Array<{url: string; reason: string}> = [];
    for (const block of blocks) {
      for (const key of ['url', 'url2'] as const) {
        const source = block[key];
        if (!source || block.type === 'video' || block.type === 'youtube') continue;
        try {
          if (!imported.has(source)) imported.set(source, await importImage(productId, source));
          block[key] = imported.get(source) || source;
        } catch (error) {
          failed.push({url: source, reason: error instanceof Error ? error.message : 'Image import failed.'});
          block[key] = source;
        }
      }
    }
    return NextResponse.json({ok: true, blocks, imported: imported.size, failed});
  } catch (error) {
    console.error('[product-content-images]', error);
    return NextResponse.json({ok: false, message: error instanceof Error ? error.message : 'External image import failed.'}, {status: 400});
  }
}
