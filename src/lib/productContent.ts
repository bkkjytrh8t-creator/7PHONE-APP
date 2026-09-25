export const productContentBlockTypes = [
  'heading', 'text', 'image', 'full_image', 'two_images', 'image_text',
  'text_image', 'gif', 'video', 'youtube', 'specifications',
  'feature_list', 'divider', 'spacing'
] as const;

export type ProductContentBlockType = typeof productContentBlockTypes[number];
export type ProductContentWidth = 'small' | 'medium' | 'large' | 'full';
export type ProductContentBlock = {id: string; type: ProductContentBlockType; title?: string; text?: string; url?: string; url2?: string; caption?: string; poster?: string; provider?: string; width?: ProductContentWidth; items?: Array<{label: string; value: string}>};

function cleanText(value: unknown, max = 12000) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '';
}

function plainText(value: unknown, max = 12000) {
  const source = cleanText(value, max * 2);
  if (!source.includes('<')) return source.slice(0, max);
  return source.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\s*br\s*\/?\s*>/gi, '\n').replace(/<\/(?:p|div|h[1-6]|li|tr|dt|dd)>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').slice(0, max);
}

export function normalizeSpecificationLabel(value: unknown) {
  const label = plainText(value, 300).replace(/[:：|]+$/, '').trim();
  const key = label.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (['ram', 'memory', 'random access memory'].includes(key)) return 'RAM';
  if (['storage', 'rom', 'internal storage', 'capacity'].includes(key)) return 'Storage';
  if (['display', 'screen'].includes(key)) return 'Display';
  if (['battery', 'battery capacity'].includes(key)) return 'Battery';
  if (['os', 'operating system', 'android version'].includes(key)) return 'Operating System';
  if (['camera', 'rear camera', 'main camera'].includes(key)) return 'Camera';
  return label;
}

function specificationPair(value: unknown): {label: string; value: string} | null {
  if (typeof value === 'string') {
    const parts = value.split(/\s*(?:\||:|：)\s*/); if (parts.length < 2) return null;
    const label = normalizeSpecificationLabel(parts.shift()); const itemValue = plainText(parts.join(' | '), 2000);
    return label || itemValue ? {label, value: itemValue} : null;
  }
  if (Array.isArray(value)) {
    const label = normalizeSpecificationLabel(value[0]); const itemValue = plainText(value.slice(1).join(' · '), 2000);
    return label || itemValue ? {label, value: itemValue} : null;
  }
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const label = normalizeSpecificationLabel(row.label ?? row.key ?? row.name ?? row.title ?? row.specification ?? row.attribute);
  const itemValue = plainText(row.value ?? row.content ?? row.text ?? row.description ?? row.detail, 2000);
  return label || itemValue ? {label, value: itemValue} : null;
}

function specificationItems(value: unknown) {
  if (Array.isArray(value)) return value.slice(0, 500).flatMap((item) => specificationPair(item) ?? []);
  if (typeof value === 'string') return plainText(value).split('\n').flatMap((line) => specificationPair(line) ?? []);
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).slice(0, 500).map(([label, itemValue]) => ({label: normalizeSpecificationLabel(label), value: plainText(itemValue, 2000)})).filter((item) => item.label || item.value);
  return [];
}

function normalizedType(value: unknown, hasItems: boolean): ProductContentBlockType {
  const type = cleanText(value, 80).toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, ProductContentBlockType> = {
    h1: 'heading', h2: 'heading', h3: 'heading', title: 'heading', paragraph: 'text', rich_text: 'text', richtext: 'text', html: 'text', content: 'text',
    specification: 'specifications', specs: 'specifications', spec: 'specifications', specification_table: 'specifications', specs_table: 'specifications', table: 'specifications', key_value: 'specifications', key_value_list: 'specifications', definition_list: 'specifications',
    list: 'feature_list', bullets: 'feature_list', features: 'feature_list', full_width_image: 'full_image', image_full: 'full_image', image_and_text: 'image_text', text_and_image: 'text_image', youtube_video: 'youtube', youtube_short: 'youtube', mp4: 'video', webm: 'video'
  };
  if (productContentBlockTypes.includes(type as ProductContentBlockType)) return type as ProductContentBlockType;
  return aliases[type] ?? (hasItems ? 'specifications' : 'text');
}

export function safeContentUrl(value: unknown) {
  let source = cleanText(value, 2048); if (!source) return '';
  if (source.startsWith('//')) source = `https:${source}`;
  try { const url = new URL(source); if (url.protocol !== 'https:' || url.username || url.password) return ''; url.hash = ''; return url.toString(); } catch { return ''; }
}

export function sanitizeProductContentBlocks(input: unknown): ProductContentBlock[] {
  let value = input;
  if (typeof value === 'string') {
    const items = specificationItems(value);
    return items.length ? [{id: 'legacy-specifications', type: 'specifications', items, width: 'large'}] : plainText(value) ? [{id: 'legacy-content', type: 'text', text: plainText(value), width: 'large'}] : [];
  }
  if (!Array.isArray(value) && value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.blocks)) value = record.blocks;
    else { const items = specificationItems(record); return items.length ? [{id: 'legacy-specifications', type: 'specifications', items, width: 'large'}] : []; }
  }
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.slice(0, 400).flatMap((candidate, index) => {
    if (typeof candidate === 'string') candidate = {type: 'text', text: candidate};
    if (!candidate || typeof candidate !== 'object') return [];
    const row = candidate as Record<string, unknown>;
    const rawItems = row.items ?? row.rows ?? row.specifications ?? row.specs ?? row.values ?? row.data;
    let items = specificationItems(rawItems);
    const fallbackText = plainText(row.text ?? row.content ?? row.html ?? row.body ?? row.value ?? row.description);
    if (!items.length && /(?:spec|table|key.?value|definition)/i.test(cleanText(row.type, 80))) items = specificationItems(fallbackText);
    const type = normalizedType(row.type, items.length > 0);
    const id = cleanText(row.id, 100) || `content-${index + 1}`; if (seen.has(id)) return []; seen.add(id);
    const width: ProductContentWidth = ['small', 'medium', 'large', 'full'].includes(String(row.width)) ? row.width as ProductContentWidth : 'large';
    const block: ProductContentBlock = {id, type, title: plainText(row.title ?? row.heading ?? row.name, 300), text: fallbackText, url: safeContentUrl(row.url ?? row.src ?? row.image_url ?? row.video_url), url2: safeContentUrl(row.url2 ?? row.second_url ?? row.image_url_2), caption: plainText(row.caption ?? row.alt, 500), poster: safeContentUrl(row.poster ?? row.thumbnail_url), provider: plainText(row.provider ?? row.source_type, 40).toLowerCase(), width, items};
    const hasContent = block.title || block.text || block.url || block.url2 || block.items?.length || type === 'divider' || type === 'spacing';
    return hasContent ? [block] : [];
  });
}
