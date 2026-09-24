import dns from 'dns/promises';
import net from 'net';
import {load} from 'cheerio';
import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {sanitizeProductContentBlocks, type ProductContentBlock} from '@/lib/productContent';

export const runtime = 'nodejs';

const maxHtmlBytes = 6 * 1024 * 1024;

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

async function publicPageUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A supplier URL is required.');
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only public HTTP/HTTPS URLs are allowed.');
  if (url.hostname === 'localhost' || (net.isIP(url.hostname) && privateAddress(url.hostname))) throw new Error('Private or local URLs are not allowed.');
  const addresses = await dns.lookup(url.hostname, {all: true});
  if (!addresses.length || addresses.some(({address}) => privateAddress(address))) throw new Error('Private or local URLs are not allowed.');
  return url;
}

function absoluteUrl(value: string | undefined, base: URL) {
  if (!value || /^(?:data|blob|javascript):/i.test(value.trim())) return '';
  try {
    const url = new URL(value.trim(), base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    url.hash = '';
    return url.toString();
  } catch { return ''; }
}

function provider(url: string) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/\.webm(?:\?|$)/i.test(url)) return 'webm';
  return 'mp4';
}

function parsePage(html: string, pageUrl: URL) {
  const $ = load(html);
  const bundleUrl = $('link[href$="main.css"],script[src$="main.js"]').toArray().map((element) => absoluteUrl($(element).attr('href') || $(element).attr('src'), pageUrl)).find(Boolean);
  const assetBase = bundleUrl ? new URL('.', bundleUrl) : pageUrl;
  const resolveUrl = (value: string | undefined) => absoluteUrl(value, value?.trim().startsWith('./assets/') ? assetBase : pageUrl);
  const resolveSrcset = (value: string | undefined) => (value || '').split(',').map((item) => item.trim().split(/\s+/)[0]).filter(Boolean).reverse().map(resolveUrl).find(Boolean) || '';
  $('script,style,noscript,template,form,nav,header,footer,aside,dialog,button,input,select,textarea,svg,canvas,[class*="cookie" i],[id*="cookie" i],[class*="advert" i],[class*="menu" i],[class*="navigation" i]').remove();
  const root = $('main').first().length ? $('main').first() : $('article').first().length ? $('article').first() : $('body');
  const blocks: ProductContentBlock[] = [];
  let skippedMedia = 0;
  const signatures = new Set<string>();
  const push = (block: ProductContentBlock) => {
    const signature = `${block.type}|${block.title || block.text || ''}|${block.url || ''}`.toLowerCase();
    if (signatures.has(signature)) return;
    signatures.add(signature);
    blocks.push(block);
  };
  const text = (value: string) => value.replace(/\s+/g, ' ').trim();
  const imageFrom = (element: ReturnType<typeof $>) => {
    for (const name of ['data-src', 'data-original', 'data-lazy-src', 'data-url']) {
      const url = resolveUrl(element.attr(name)); if (url) return url;
    }
    const responsive = Object.entries(element.attr() || {}).filter(([name]) => /^data-src-(?:pc|desktop|1920|1440|1024|768|650|360|mobile|mo|pad)$/i.test(name)).map(([, value]) => resolveUrl(value)).find(Boolean);
    if (responsive) return responsive;
    for (const name of ['data-srcset', 'srcset']) {
      const url = resolveSrcset(element.attr(name)); if (url) return url;
    }
    return resolveUrl(element.attr('src'));
  };

  root.find('h1,h2,h3,h4,p,img,picture,video,iframe,table,ul,ol,dl,[style*="background" i],[data-src-pc],[data-src-ios],[data-config-key*="text" i],[data-config-key*="title" i]').each((_, element) => {
    const node = $(element);
    const tag = element.tagName?.toLowerCase();
    if (tag === 'img' && node.closest('picture').length) return;
    if (node.parents('table,ul,ol,dl').length) return;
    if (/^h[1-4]$/.test(tag)) {
      const title = text(node.text()); if (title.length > 1 && title.length < 500) push({id: `url-${blocks.length + 1}`, type: 'heading', title, width: 'large'}); return;
    }
    if (tag === 'p') {
      const value = text(node.text()); if (value.length > 2) push({id: `url-${blocks.length + 1}`, type: 'text', text: value, width: 'large'}); return;
    }
    if (!['img', 'picture', 'video', 'iframe'].includes(tag) && node.attr('data-config-key') && !node.find('img,video,iframe').length) {
      const value = text(node.text());
      if (value.length > 2 && value.length < 3000) push({id: `url-${blocks.length + 1}`, type: /title/i.test(node.attr('data-config-key') || '') && value.length < 500 ? 'heading' : 'text', ...(/title/i.test(node.attr('data-config-key') || '') && value.length < 500 ? {title: value} : {text: value}), width: 'large'});
      return;
    }
    if (tag === 'img' || tag === 'picture') {
      const image = tag === 'picture' ? node.find('img').first() : node;
      const source = tag === 'picture' ? node.find('source').first() : null;
      const url = source ? resolveSrcset(source.attr('data-srcset') || source.attr('srcset')) || resolveUrl(source.attr('data-src') || source.attr('src')) || imageFrom(image) : imageFrom(image);
      if (!url) { skippedMedia += 1; return; }
      const width = Number(image.attr('width') || 0), height = Number(image.attr('height') || 0);
      if (width && height && width <= 2 && height <= 2) return;
      push({id: `url-${blocks.length + 1}`, type: /\.gif(?:\?|$)/i.test(url) ? 'gif' : 'image', url, caption: text(image.attr('alt') || ''), width: width >= 1000 ? 'full' : 'large'}); return;
    }
    if (tag === 'video') {
      const source = node.find('source').first();
      const owner = node.closest('[data-src-pc],[data-src-ios]').first();
      const url = resolveUrl(node.attr('data-src') || node.attr('src') || source.attr('data-src') || source.attr('src') || owner.attr('data-src-pc') || owner.attr('data-src-ios'));
      if (url) push({id: `url-${blocks.length + 1}`, type: 'video', url, poster: resolveUrl(node.attr('poster')), provider: provider(url), width: 'large'}); else skippedMedia += 1; return;
    }
    if (tag === 'iframe') {
      const url = resolveUrl(node.attr('data-src') || node.attr('src'));
      if (url && /youtube\.com|youtu\.be|vimeo\.com|instagram\.com|tiktok\.com/i.test(url)) push({id: `url-${blocks.length + 1}`, type: /youtu/i.test(url) ? 'youtube' : 'video', url, provider: provider(url), width: 'large'}); else skippedMedia += 1; return;
    }
    if (tag === 'table') {
      const items = node.find('tr').toArray().flatMap((row) => { const cells = $(row).find('th,td').toArray().map((cell) => text($(cell).text())); return cells.length >= 2 ? [{label: cells[0], value: cells.slice(1).join(' · ')}] : []; });
      if (items.length) push({id: `url-${blocks.length + 1}`, type: 'specifications', items, width: 'large'}); return;
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = node.children('li').toArray().map((item) => ({label: text($(item).text()), value: ''})).filter((item) => item.label);
      if (items.length) push({id: `url-${blocks.length + 1}`, type: 'feature_list', items, width: 'large'}); return;
    }
    if (tag === 'dl') {
      const items = node.children('dt').toArray().map((term) => ({label: text($(term).text()), value: text($(term).next('dd').text())})).filter((item) => item.label || item.value);
      if (items.length) push({id: `url-${blocks.length + 1}`, type: 'specifications', items, width: 'large'}); return;
    }
    const match = (node.attr('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/i);
    const customVideo = resolveUrl(node.attr('data-src-pc') || node.attr('data-src-ios'));
    if (customVideo && /\.(?:mp4|webm)(?:\?|$)/i.test(customVideo)) {
      push({id: `url-${blocks.length + 1}`, type: 'video', url: customVideo, provider: provider(customVideo), width: 'large'}); return;
    }
    const url = resolveUrl(match?.[2]);
    if (url) push({id: `url-${blocks.length + 1}`, type: /\.gif(?:\?|$)/i.test(url) ? 'gif' : 'image', url, width: 'large'});
  });
  const safe = sanitizeProductContentBlocks(blocks);
  return {blocks: safe, images: safe.filter((block) => ['image', 'full_image', 'gif'].includes(block.type)).length, videos: safe.filter((block) => ['video', 'youtube'].includes(block.type)).length, warnings: skippedMedia ? [`${skippedMedia} media element(s) were skipped because no safe supported URL was found.`] : []};
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ok: false, message: 'Unauthorized.'}, {status: 401});
  try {
    const body = await request.json().catch(() => null) as {url?: unknown} | null;
    const requestedUrl = await publicPageUrl(body?.url);
    const response = await fetch(requestedUrl, {redirect: 'follow', signal: AbortSignal.timeout(25000), headers: {'User-Agent': 'Mozilla/5.0 (compatible; 7Phone Product Importer/1.0)', Accept: 'text/html,application/xhtml+xml'}});
    if (!response.ok) throw new Error(`Supplier page returned HTTP ${response.status}.`);
    const finalUrl = await publicPageUrl(response.url);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) throw new Error('The supplied URL is not an HTML page.');
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > maxHtmlBytes) throw new Error('Supplier page is too large.');
    const html = await response.text();
    if (Buffer.byteLength(html) > maxHtmlBytes) throw new Error('Supplier page is too large.');
    const parsed = parsePage(html, finalUrl);
    return NextResponse.json({ok: true, source_url: finalUrl.toString(), ...parsed});
  } catch (error) {
    console.error('[product-content-import]', error);
    return NextResponse.json({ok: false, message: error instanceof Error ? error.message : 'Could not import supplier page.'}, {status: 400});
  }
}
