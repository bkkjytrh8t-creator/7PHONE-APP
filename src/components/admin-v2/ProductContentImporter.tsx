'use client';

import {useState} from 'react';
import type {ClipboardEvent} from 'react';
import type {Locale} from '@/lib/types';
import {ProductContentBlocks} from '@/components/ProductContentBlocks';
import {normalizeSpecificationLabel, sanitizeProductContentBlocks, safeContentUrl, type ProductContentBlock, type ProductContentBlockType} from '@/lib/productContent';

const types: ProductContentBlockType[] = ['heading', 'text', 'image', 'full_image', 'two_images', 'image_text', 'text_image', 'gif', 'video', 'youtube', 'specifications', 'feature_list', 'divider', 'spacing'];

function id() { return `content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function clean(value: string) { return value.replace(/\s+/g, ' ').trim(); }
function isVideo(url: string) { return /(?:youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|\.(?:mp4|webm)(?:\?|$))/i.test(url); }
function videoProvider(url: string) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/\.webm(?:\?|$)/i.test(url)) return 'webm';
  return 'mp4';
}
function srcsetUrl(value: string | null | undefined) {
  const candidates = (value || '').split(',').map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean);
  return candidates.reverse().map(safeContentUrl).find(Boolean) || '';
}
function imageUrl(image: Element | null) {
  if (!image) return '';
  const attributes = ['data-src', 'data-original', 'data-lazy-src', 'data-url'];
  for (const attribute of attributes) {
    const url = safeContentUrl(image.getAttribute(attribute));
    if (url) return url;
  }
  for (const attribute of ['data-srcset', 'srcset']) {
    const url = srcsetUrl(image.getAttribute(attribute));
    if (url) return url;
  }
  return safeContentUrl(image.getAttribute('src'));
}
function backgroundUrl(style: string | null) {
  const match = (style || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)(https:\/\/[^)'"\s]+)\1\s*\)/i);
  return safeContentUrl(match?.[2]);
}

function parseImportedContent(source: string, html: string): ProductContentBlock[] {
  if (!html.trim()) {
    const result: ProductContentBlock[] = [];
    const specifications: Array<{label: string; value: string}> = [];
    source.split(/\n+/).map(clean).filter(Boolean).forEach((value, index) => {
      const url = safeContentUrl(value);
      if (url && /\.(?:jpe?g|png|webp|avif|gif)(?:\?|$)/i.test(url)) {
        result.push({id: id(), type: /\.gif(?:\?|$)/i.test(url) ? 'gif' : 'image', url, width: 'large'}); return;
      }
      if (url && isVideo(url)) { result.push({id: id(), type: /youtu/i.test(url) ? 'youtube' : 'video', url, width: 'large'}); return; }
      const specification = value.match(/^(.{2,80}?)\s*(?:\||:|：)\s*(.+)$/);
      if (specification) { specifications.push({label: specification[1].trim(), value: specification[2].trim()}); return; }
      result.push({id: id(), type: index === 0 && value.length < 120 ? 'heading' : 'text', ...(index === 0 && value.length < 120 ? {title: value} : {text: value}), width: 'large'});
    });
    if (specifications.length) result.push({id: id(), type: 'specifications', items: specifications, width: 'large'});
    return sanitizeProductContentBlocks(result);
  }
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script,style,noscript,form,nav,header,footer,aside,dialog,button,input,select,textarea,svg,canvas,[class*="cookie" i],[id*="cookie" i],[class*="advert" i],[class*="menu" i],[class*="navigation" i]').forEach((node) => node.remove());
  const blocks: ProductContentBlock[] = [];
  const seen = new Set<string>();
  const push = (block: ProductContentBlock) => {
    const signature = `${block.type}|${block.title || ''}|${block.text || ''}|${block.url || ''}|${block.url2 || ''}`.toLowerCase();
    if (!signature.replace(/[|]/g, '') || seen.has(signature)) return;
    seen.add(signature); blocks.push(block);
  };
  const candidates = [...document.body.querySelectorAll('h1,h2,h3,p,img,picture,video,iframe,a,table,ul,ol,dl,[style*="background" i]')];
  candidates.forEach((node) => {
    if (node.matches('img') && node.closest('picture')) return;
    if (node.closest('table,ul,ol') !== node && node.closest('table,ul,ol')) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-3]$/.test(tag)) {
      const title = clean(node.textContent || ''); if (title) push({id: id(), type: 'heading', title, width: 'large'}); return;
    }
    if (tag === 'p') {
      const value = clean(node.textContent || ''); if (value.length > 2) push({id: id(), type: 'text', text: value, width: 'medium'}); return;
    }
    if (tag === 'img' || tag === 'picture') {
      const image = tag === 'img' ? node as HTMLImageElement : node.querySelector('img');
      const declaredWidth = Number(image?.getAttribute('width') || 0);
      const declaredHeight = Number(image?.getAttribute('height') || 0);
      if (declaredWidth > 0 && declaredHeight > 0 && declaredWidth <= 2 && declaredHeight <= 2) return;
      const pictureSource = tag === 'picture' ? node.querySelector('source') : null;
      const url = safeContentUrl(pictureSource?.getAttribute('data-src') || pictureSource?.getAttribute('src')) || srcsetUrl(pictureSource?.getAttribute('data-srcset') || pictureSource?.getAttribute('srcset')) || imageUrl(image);
      if (!url) return;
      const gif = /\.gif(?:\?|$)/i.test(url);
      push({id: id(), type: gif ? 'gif' : declaredWidth >= 1000 ? 'full_image' : 'image', url, caption: clean(image?.alt || ''), width: declaredWidth >= 1000 ? 'full' : 'large'}); return;
    }
    if (tag === 'video') {
      const source = node.querySelector('source');
      const url = safeContentUrl(node.getAttribute('data-src') || node.getAttribute('src') || source?.getAttribute('data-src') || source?.getAttribute('src'));
      if (url) push({id: id(), type: 'video', url, provider: videoProvider(url), width: 'large'}); return;
    }
    if (tag === 'iframe') {
      const url = safeContentUrl(node.getAttribute('src'));
      if (url && isVideo(url)) push({id: id(), type: /youtu/i.test(url) ? 'youtube' : 'video', url, provider: videoProvider(url), width: 'large'}); return;
    }
    if (tag === 'a') {
      const url = safeContentUrl(node.getAttribute('href')); if (url && isVideo(url)) push({id: id(), type: /youtu/i.test(url) ? 'youtube' : 'video', url, provider: videoProvider(url), width: 'large'}); return;
    }
    if (tag === 'table') {
      const items = [...node.querySelectorAll('tr')].flatMap((row) => { const cells = [...row.querySelectorAll('th,td')].map((cell) => clean(cell.textContent || '')); return cells.length >= 2 ? [{label: cells[0], value: cells.slice(1).join(' · ')}] : []; });
      if (items.length) push({id: id(), type: 'specifications', items, width: 'large'}); return;
    }
    if (tag === 'ul' || tag === 'ol') {
      const values = [...node.querySelectorAll(':scope > li')].map((item) => clean(item.textContent || '')).filter(Boolean);
      const pairs = values.map((value) => value.match(/^(.{2,80}?)\s*(?:\||:|：)\s*(.+)$/)).filter(Boolean);
      const items = pairs.length === values.length ? pairs.map((match) => ({label: normalizeSpecificationLabel(match![1]), value: match![2].trim()})) : values.map((label) => ({label, value: ''}));
      if (items.length) push({id: id(), type: pairs.length === values.length ? 'specifications' : 'feature_list', items, width: 'large'});
      return;
    }
    if (tag === 'dl') {
      const items = [...node.querySelectorAll(':scope > dt')].map((term) => ({label: normalizeSpecificationLabel(term.textContent || ''), value: clean(term.nextElementSibling?.tagName.toLowerCase() === 'dd' ? term.nextElementSibling.textContent || '' : '')})).filter((item) => item.label || item.value);
      if (items.length) push({id: id(), type: 'specifications', items, width: 'large'});
      return;
    }
    const url = backgroundUrl(node.getAttribute('style'));
    if (url) push({id: id(), type: /\.gif(?:\?|$)/i.test(url) ? 'gif' : 'image', url, width: 'large'});
  });
  const arranged: ProductContentBlock[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const current = blocks[index];
    const next = blocks[index + 1];
    const currentImage = ['image', 'full_image'].includes(current.type);
    const nextImage = next && ['image', 'full_image'].includes(next.type);
    if (currentImage && nextImage) {
      arranged.push({...current, type: 'two_images', url2: next.url, width: 'large'}); index += 1; continue;
    }
    if (currentImage && next?.type === 'text' && (next.text?.length ?? 0) < 1200) {
      arranged.push({...current, type: 'image_text', title: next.title, text: next.text, width: 'large'}); index += 1; continue;
    }
    if (current.type === 'text' && nextImage && (current.text?.length ?? 0) < 1200) {
      arranged.push({...current, type: 'text_image', url: next.url, caption: next.caption, width: 'large'}); index += 1; continue;
    }
    arranged.push(current);
  }
  return sanitizeProductContentBlocks(arranged);
}

export function ProductContentImporter({locale, productId, blocks, busy, onChange, onSave, setMessage}: {
  locale: Locale; productId?: number | string; blocks: unknown; busy: boolean;
  onChange: (blocks: ProductContentBlock[]) => void;
  onSave: (blocks: ProductContentBlock[]) => Promise<boolean>;
  setMessage: (message: string) => void;
}) {
  const ar = locale === 'ar'; const t = (en: string, arabic: string) => ar ? arabic : en;
  const safe = sanitizeProductContentBlocks(blocks);
  const [source, setSource] = useState(''); const [html, setHtml] = useState('');
  const [supplierUrl, setSupplierUrl] = useState(''); const [importingUrl, setImportingUrl] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [preview, setPreview] = useState(false); const [dragId, setDragId] = useState('');
  function paste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const rich = event.clipboardData.getData('text/html');
    const plain = event.clipboardData.getData('text/plain');
    if (!rich && !plain) return;
    event.preventDefault();
    setHtml(rich);
    setSource(plain || clean(new DOMParser().parseFromString(rich, 'text/html').body.textContent || ''));
  }
  function importContent() {
    const parsed = parseImportedContent(source, html);
    const parsedMedia = parsed.filter((block) => ['image', 'full_image', 'two_images', 'image_text', 'text_image', 'gif', 'video', 'youtube'].includes(block.type)).reduce((count, block) => count + (block.type === 'two_images' ? 2 : 1), 0);
    const pastedDocument = html ? new DOMParser().parseFromString(html, 'text/html') : null;
    const expectedMedia = pastedDocument ? pastedDocument.querySelectorAll('picture,video,iframe').length + [...pastedDocument.querySelectorAll('img')].filter((image) => !image.closest('picture')).length : 0;
    setWarnings(expectedMedia > parsedMedia ? [t(`${expectedMedia - parsedMedia} media element(s) could not be imported because no safe supported URL was found.`, `تعذر استيراد ${expectedMedia - parsedMedia} عنصر وسائط لعدم العثور على رابط آمن ومدعوم.`)] : []);
    onChange(parsed); setPreview(true);
    setMessage(parsed.length ? t(`${parsed.length} clean content blocks detected.`, `تم اكتشاف ${parsed.length} كتلة محتوى نظيفة.`) : t('No useful product content was detected.', 'لم يتم اكتشاف محتوى منتج مفيد.'));
  }
  async function importUrl() {
    setImportingUrl(true);
    try {
      const response = await fetch('/api/admin/product-content-import', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url: supplierUrl})});
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) { setMessage(result?.message || t('Could not import supplier page.', 'تعذر استيراد صفحة المورد.')); return; }
      const next = sanitizeProductContentBlocks(result.blocks);
      setWarnings(Array.isArray(result.warnings) ? result.warnings : []);
      onChange(next); setPreview(true);
      setMessage(t(`Imported ${next.length} blocks, ${result.images} images and ${result.videos} videos. Review the preview before saving.`, `تم استيراد ${next.length} كتلة و${result.images} صورة و${result.videos} فيديو. راجع المعاينة قبل الحفظ.`));
    } finally { setImportingUrl(false); }
  }
  function update(index: number, patch: Partial<ProductContentBlock>) { onChange(safe.map((block, itemIndex) => itemIndex === index ? {...block, ...patch} : block)); }
  function reorder(target: string) { if (!dragId || dragId === target) return; const next = [...safe]; const from = next.findIndex((b) => b.id === dragId); const to = next.findIndex((b) => b.id === target); if (from >= 0 && to >= 0) next.splice(to, 0, next.splice(from, 1)[0]); setDragId(''); onChange(next); }
  async function save() {
    let next = safe;
    if (productId) {
      const response = await fetch('/api/admin/product-content-images', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({productId, blocks: safe})});
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) { setMessage(result?.message || t('Could not import external images.', 'تعذر استيراد الصور الخارجية.')); return; }
      next = sanitizeProductContentBlocks(result.blocks); onChange(next);
      if (Array.isArray(result.failed) && result.failed.length) setWarnings(result.failed.map((item: {url?: string; reason?: string}) => `${item.reason || t('Media download failed.', 'فشل تنزيل الوسائط.')} ${item.url || ''}`.trim()));
    }
    const saved = await onSave(next); if (saved) setMessage(t('Product content saved.', 'تم حفظ محتوى المنتج.'));
  }
  return <section className="grid gap-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/40 p-4">
    <div><h4 className="text-xl font-black">{t('Full Product Page Import', 'استيراد صفحة المنتج كاملة')}</h4><p className="mt-1 text-sm font-semibold text-zinc-600">{t('Paste the official product page content here. Text, images, video and specifications will be imported automatically.', 'ألصق محتوى صفحة المنتج الرسمية هنا، وسيتم استيراد النصوص والصور والفيديو والمواصفات تلقائيًا.')}</p></div>
    <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
      <label className="grid gap-1 text-sm font-black sm:col-span-2">{t('Supplier Product Page URL', 'رابط صفحة منتج المورد')}<span className="text-xs font-semibold text-zinc-500">{t('The page is fetched securely on the server to include promotional media.', 'يتم جلب الصفحة بأمان من الخادم لتضمين الصور والوسائط الترويجية.')}</span></label>
      <input className="h-12 min-w-0 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-950 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" dir="ltr" inputMode="url" onChange={(event) => setSupplierUrl(event.target.value)} placeholder="https://manufacturer.com/product/..." type="url" value={supplierUrl} />
      <button className="min-h-12 rounded-xl bg-zinc-950 px-5 text-sm font-black text-white disabled:opacity-40" disabled={importingUrl || !supplierUrl.trim()} onClick={() => void importUrl()} type="button">{importingUrl ? t('Importing…', 'جارٍ الاستيراد…') : t('Import Full Product Content', 'استيراد محتوى المنتج الكامل')}</button>
    </div>
    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />{t('or paste content', 'أو ألصق المحتوى')}<span className="h-px flex-1 bg-zinc-200" /></div>
    <textarea className="min-h-72 rounded-xl border border-zinc-300 bg-white p-5 text-sm leading-7 text-zinc-950 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" onPaste={paste} placeholder={t('Copy the complete official product page and paste it here', 'انسخ صفحة المنتج الرسمية كاملة وألصقها هنا')} value={source} onChange={(event) => {setSource(event.target.value); if (!event.target.value) setHtml('');}} />
    <div className="flex flex-wrap gap-2"><button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40" disabled={!source.trim()} onClick={importContent} type="button">{t('Import & Format', 'استيراد وتنسيق')}</button><button className="rounded-xl border bg-white px-4 py-2.5 text-sm font-black" disabled={!safe.length} onClick={() => setPreview(!preview)} type="button">{t('Content Preview', 'معاينة المحتوى')}</button><button className="rounded-xl border bg-white px-4 py-2.5 text-sm font-black" onClick={() => {setSource(''); setHtml(''); setWarnings([]); onChange([]); setPreview(false);}} type="button">{t('Clear', 'مسح')}</button><button className="rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40" disabled={busy || !safe.length} onClick={() => void save()} type="button">{t('Save Content', 'حفظ المحتوى')}</button></div>
    {warnings.length ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900"><strong>{t('Import warnings', 'تحذيرات الاستيراد')}</strong><ul className="mt-2 list-disc space-y-1 ps-5">{warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div> : null}
    {safe.length ? <div className="grid gap-3">{safe.map((block, index) => <article className="rounded-xl border border-zinc-200 bg-white p-3" draggable key={block.id} onDragStart={() => setDragId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(block.id)}><div className="flex flex-wrap items-center gap-2"><span className="cursor-grab text-zinc-400">⋮⋮ #{index + 1}</span><select className="h-10 rounded-lg border px-2 text-sm" value={block.type} onChange={(event) => update(index, {type: event.target.value as ProductContentBlockType})}>{types.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}</select><select className="h-10 rounded-lg border px-2 text-sm" value={block.width || 'large'} onChange={(event) => update(index, {width: event.target.value as ProductContentBlock['width']})}>{['small', 'medium', 'large', 'full'].map((width) => <option key={width}>{width}</option>)}</select><button className="ms-auto rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600" onClick={() => onChange(safe.filter((_, itemIndex) => itemIndex !== index))} type="button">{t('Delete', 'حذف')}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><input className="h-11 rounded-lg border px-3" placeholder={t('Heading / title', 'العنوان')} value={block.title || ''} onChange={(event) => update(index, {title: event.target.value})} /><input className="h-11 rounded-lg border px-3" dir="ltr" placeholder="https://…" value={block.url || ''} onChange={(event) => update(index, {url: event.target.value})} />{block.type === 'two_images' ? <input className="h-11 rounded-lg border px-3" dir="ltr" placeholder={t('Second image URL', 'رابط الصورة الثانية')} value={block.url2 || ''} onChange={(event) => update(index, {url2: event.target.value})} /> : null}{block.type === 'specifications' || block.type === 'feature_list' ? <textarea className="min-h-28 rounded-lg border p-3 sm:col-span-2" placeholder={t('One item per line: Label | Value', 'عنصر في كل سطر: العنوان | القيمة')} value={(block.items ?? []).map((item) => `${item.label} | ${item.value}`).join('\n')} onChange={(event) => update(index, {items: event.target.value.split('\n').map((line) => {const [label, ...value] = line.split('|'); return {label: label.trim(), value: value.join('|').trim()};}).filter((item) => item.label || item.value)})} /> : <textarea className="min-h-24 rounded-lg border p-3 sm:col-span-2" placeholder={t('Text', 'النص')} value={block.text || ''} onChange={(event) => update(index, {text: event.target.value})} />}</div></article>)}</div> : null}
    {preview && safe.length ? <div className="rounded-2xl border border-zinc-200 bg-white p-5"><ProductContentBlocks blocks={safe} locale={locale} preview /></div> : null}
  </section>;
}
