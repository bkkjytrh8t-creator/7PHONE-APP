'use client';

import {useEffect, useMemo, useState} from 'react';
import {FallbackImage} from '@/components/FallbackImage';
import {parseProductVideoUrl} from '@/lib/productMedia';
import type {Locale} from '@/lib/types';

type Row = Record<string, any>;
type SectionType = 'hero' | 'small_banner' | 'products' | 'featured_products' | 'categories' | 'brands';
type Config = {
  type: SectionType;
  desktop_image?: string;
  mobile_image?: string;
  desktop_media_type?: 'image' | 'video' | 'youtube';
  mobile_media_type?: 'image' | 'video' | 'youtube';
  destination_url?: string;
  description_ar?: string;
  description_en?: string;
  button_ar?: string;
  button_en?: string;
  price?: string;
  item_ids?: Array<string | number>;
  hidden_item_ids?: Array<string | number>;
};
type Section = {id: string; title_ar: string; title_en: string; source: string; is_visible: boolean; sort_order: number; config: Config};

const prefix = 'homepage-config:';
const definitions: Array<{type: SectionType; ar: string; en: string}> = [
  {type: 'hero', ar: 'البنر الرئيسي', en: 'Hero Banner'},
  {type: 'small_banner', ar: 'البنرات الصغيرة', en: 'Small Banners'},
  {type: 'products', ar: 'أحدث المنتجات', en: 'Latest Products'},
  {type: 'featured_products', ar: 'المنتجات المميزة', en: 'Featured Products'},
  {type: 'categories', ar: 'التصنيفات', en: 'Categories'},
  {type: 'brands', ar: 'الماركات', en: 'Brands'}
];

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
function inferredType(row: Row): SectionType {
  const value = `${row.id} ${row.title_en} ${row.source}`.toLowerCase();
  if (value.includes('small')) return 'small_banner';
  if (value.includes('featured')) return 'featured_products';
  if (value.includes('product')) return 'products';
  if (value.includes('categor')) return 'categories';
  if (value.includes('brand')) return 'brands';
  return 'hero';
}
function decode(row: Row, index: number): Section {
  let config: Config = {type: inferredType(row)};
  if (text(row.source).startsWith(prefix)) {
    try { config = {...config, ...JSON.parse(decodeURIComponent(text(row.source).slice(prefix.length)))}; } catch {}
  }
  return {id: text(row.id) || `homepage-${index}`, title_ar: text(row.title_ar), title_en: text(row.title_en), source: text(row.source), is_visible: row.is_visible !== false, sort_order: Number(row.sort_order ?? index), config};
}
function encode(section: Section, index: number) {
  return {id: section.id, title_ar: section.title_ar, title_en: section.title_en, source: `${prefix}${encodeURIComponent(JSON.stringify(section.config))}`, is_visible: section.is_visible, sort_order: index};
}
function blank(type: SectionType, index: number): Section {
  const definition = definitions.find((item) => item.type === type)!;
  return {id: `homepage-${type}`, title_ar: definition.ar, title_en: definition.en, source: '', is_visible: !['hero', 'small_banner'].includes(type), sort_order: index, config: {type}};
}
function inputClass() { return 'h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100'; }
function labelClass() { return 'grid gap-1.5 text-xs font-black text-zinc-600'; }
function mediaTypeForUrl(value: string): 'image' | 'video' | 'youtube' {
  const parsed = parseProductVideoUrl(value);
  if (parsed?.source_type === 'youtube') return 'youtube';
  return parsed?.source_type === 'mp4' || parsed?.source_type === 'webm' ? 'video' : 'image';
}
function youtubeEmbed(value: string) {
  const parsed = parseProductVideoUrl(value); if (parsed?.source_type !== 'youtube') return '';
  const id = new URL(parsed.url).searchParams.get('v') || '';
  return `${parsed.embed_url}&controls=0&loop=1&playlist=${encodeURIComponent(id)}&rel=0&modestbranding=1&disablekb=1`;
}

export function HomepageManager({rows, categories, brands, busy, locale, action}: {rows: Row[]; products: Row[]; categories: Row[]; brands: Row[]; busy: boolean; locale: Locale; action: (action: string, payload: Row) => Promise<boolean>}) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedType, setSelectedType] = useState<SectionType>('hero');
  const [selectedId, setSelectedId] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const decoded = rows.map(decode).sort((a, b) => a.sort_order - b.sort_order);
    const complete = [...decoded];
    definitions.forEach((definition) => { if (!complete.some((section) => section.config.type === definition.type)) complete.push(blank(definition.type, complete.length)); });
    setSections(complete.map((section, index) => ({...section, sort_order: index})));
    setSelectedId((current) => current && complete.some((section) => section.id === current) ? current : complete.find((section) => section.config.type === selectedType)?.id || complete[0]?.id || '');
  }, [rows]);

  const selected = sections.find((section) => section.id === selectedId) ?? sections.find((section) => section.config.type === selectedType) ?? null;
  const groupSections = useMemo(() => sections.filter((section) => section.config.type === selectedType), [sections, selectedType]);

  function choose(type: SectionType) { setSelectedType(type); setSelectedId(sections.find((section) => section.config.type === type)?.id || ''); setNotice(''); }
  function update(patch: Partial<Section>, config?: Partial<Config>) { if (!selected) return; setSections((current) => current.map((section) => section.id === selected.id ? {...section, ...patch, config: config ? {...section.config, ...config} : section.config} : section)); }
  function addSlide() { const index = sections.length, section = blank(selectedType === 'hero' ? 'hero' : 'small_banner', index); section.id = `homepage-${section.config.type}-${Date.now()}`; section.is_visible = false; setSections((current) => [...current, section]); setSelectedId(section.id); }
  function duplicate() { if (!selected) return; const copy = {...selected, id: `${selected.id}-copy-${Date.now()}`, title_ar: `${selected.title_ar} - نسخة`, title_en: `${selected.title_en} - Copy`, config: {...selected.config}, sort_order: sections.length}; setSections((current) => [...current, copy]); setSelectedId(copy.id); }
  function remove() { if (!selected || !window.confirm(t('Delete this slide?', 'حذف هذه الشريحة؟'))) return; setSections((current) => current.filter((section) => section.id !== selected.id)); setSelectedId(groupSections.find((section) => section.id !== selected.id)?.id || ''); }
  function move(direction: -1 | 1) { if (!selected) return; setSections((current) => { const next = [...current], index = next.findIndex((section) => section.id === selected.id), target = index + direction; if (index < 0 || target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next.map((section, order) => ({...section, sort_order: order})); }); }

  async function upload(file: File, field: 'desktop_image' | 'mobile_image') {
    if (!selected) return;
    setUploading(true); setNotice(t('Uploading media…', 'جارٍ رفع الوسائط…'));
    try {
      const body = new FormData(); body.set('file', file); body.set('sectionId', selected.id);
      const response = await fetch('/api/admin/homepage-image', {method: 'POST', credentials: 'same-origin', body});
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.url) throw new Error(result?.message || t('Upload failed.', 'فشل الرفع.'));
      update({is_visible: true}, {[field]: result.url, [field === 'desktop_image' ? 'desktop_media_type' : 'mobile_media_type']: result.mediaType === 'video' ? 'video' : 'image'});
      setNotice(t('Upload completed. Click Save & Publish.', 'اكتمل الرفع. اضغط حفظ ونشر.'));
    } catch (error) { setNotice(error instanceof Error ? error.message : t('Upload failed.', 'فشل الرفع.')); }
    finally { setUploading(false); }
  }

  async function saveAndPublish() {
    if (!selected) return;
    if (selected.is_visible && ['hero', 'small_banner'].includes(selected.config.type) && !text(selected.config.desktop_image) && !text(selected.config.mobile_image)) { setNotice(t('Hero media is required.', 'وسائط البنر مطلوبة.')); return; }
    setNotice(t('Saving to the database…', 'جارٍ الحفظ في قاعدة البيانات…'));
    const ordered = sections.map((section, index) => ({...section, sort_order: index}));
    const ok = await action('publishHomepage', {rows: ordered.map(encode), deletedIds: rows.map((row) => String(row.id)).filter((id) => !ordered.some((section) => section.id === id))});
    if (!ok) { setNotice(t('Save failed. See the server error above.', 'فشل الحفظ. راجع خطأ الخادم أعلاه.')); return; }
    const publicMedia = selected.is_visible ? text(selected.config.desktop_image) : '';
    if (publicMedia) {
      const response = await fetch(`/${locale}?homepage-check=${Date.now()}`, {cache: 'no-store'});
      const html = await response.text();
      if (!response.ok || !html.includes(publicMedia.replace(/&/g, '&amp;')) && !html.includes(publicMedia)) { setNotice(t('Saved, but public verification failed. The banner was not found on the homepage.', 'تم الحفظ، لكن فشل التحقق العام. لم يُعثر على البنر في الصفحة الرئيسية.')); return; }
    }
    setNotice(t('Saved, published, and confirmed on the public homepage.', 'تم الحفظ والنشر والتأكد من ظهوره في الصفحة العامة.'));
  }

  return <section className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <h3 className="px-2 pb-3 text-lg font-black">{t('Homepage Management', 'إدارة الصفحة الرئيسية')}</h3>
      <nav className="grid gap-1">{definitions.map((definition) => <button className={`rounded-xl px-3 py-3 text-start text-sm font-black transition ${selectedType === definition.type ? 'bg-fuchsia-600 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`} key={definition.type} onClick={() => choose(definition.type)} type="button">{ar ? definition.ar : definition.en}</button>)}</nav>
    </aside>

    <main className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black">{definitions.find((item) => item.type === selectedType)?.[ar ? 'ar' : 'en']}</h3><p className={`mt-1 text-sm font-bold ${notice.includes('فشل') || notice.includes('failed') ? 'text-red-600' : 'text-zinc-500'}`}>{notice || t('Edit the section, then save and publish.', 'عدّل القسم ثم احفظ وانشر.')}</p></div>{['hero', 'small_banner'].includes(selectedType) ? <button className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-black" onClick={addSlide} type="button">{t('Add slide', 'إضافة شريحة')}</button> : null}</div>

      {groupSections.length > 1 ? <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{groupSections.map((section, index) => <button className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-black ${selected?.id === section.id ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-zinc-200'}`} key={section.id} onClick={() => setSelectedId(section.id)} type="button">{t('Slide', 'شريحة')} {index + 1}</button>)}</div> : null}

      {selected ? <div className="grid gap-5">
        {['hero', 'small_banner'].includes(selected.config.type) ? <>
          <MediaInput config={selected.config} field="desktop_image" label={t('Desktop Image / Video', 'صورة / فيديو الكمبيوتر')} onUpload={upload} required t={t} update={update} uploading={uploading} />
          <MediaInput config={selected.config} field="mobile_image" label={t('Mobile Image / Video (optional)', 'صورة / فيديو الموبايل (اختياري)')} onUpload={upload} t={t} update={update} uploading={uploading} />
          <label className={labelClass()}>{t('Link URL (optional)', 'الرابط (اختياري)')}<input className={inputClass()} dir="ltr" placeholder="https://…" value={selected.config.destination_url || ''} onChange={(event) => update({}, {destination_url: event.target.value})} /></label>
        </> : null}

        {['categories', 'brands'].includes(selected.config.type) ? <ItemSelector config={selected.config} items={selected.config.type === 'categories' ? categories : brands} t={t} update={update} /> : null}

        <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass()}>{t('Status', 'الحالة')}<select className={inputClass()} value={selected.is_visible ? 'active' : 'hidden'} onChange={(event) => update({is_visible: event.target.value === 'active'})}><option value="active">{t('Active', 'نشط')}</option><option value="hidden">{t('Hidden', 'مخفي')}</option></select></label><label className={labelClass()}>{t('Sort Order', 'الترتيب')}<input className={inputClass()} min="0" type="number" value={selected.sort_order} onChange={(event) => update({sort_order: Number(event.target.value)})} /></label></div>

        <details className="rounded-xl border border-zinc-200 p-4"><summary className="cursor-pointer font-black">{t('Advanced Settings', 'الإعدادات المتقدمة')}</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass()}>{t('Arabic title', 'العنوان العربي')}<input className={inputClass()} value={selected.title_ar} onChange={(event) => update({title_ar: event.target.value})} /></label><label className={labelClass()}>{t('English title', 'العنوان الإنجليزي')}<input className={inputClass()} dir="ltr" value={selected.title_en} onChange={(event) => update({title_en: event.target.value})} /></label><label className={labelClass()}>{t('Arabic description', 'الوصف العربي')}<textarea className={`${inputClass()} min-h-24 py-3`} value={selected.config.description_ar || ''} onChange={(event) => update({}, {description_ar: event.target.value})} /></label><label className={labelClass()}>{t('English description', 'الوصف الإنجليزي')}<textarea className={`${inputClass()} min-h-24 py-3`} dir="ltr" value={selected.config.description_en || ''} onChange={(event) => update({}, {description_en: event.target.value})} /></label></div></details>

        <div className="flex flex-wrap gap-2"><button className="min-h-12 rounded-xl bg-fuchsia-600 px-6 text-sm font-black text-white disabled:opacity-50" disabled={busy || uploading} onClick={() => void saveAndPublish()} type="button">{busy ? t('Saving…', 'جارٍ الحفظ…') : t('Save & Publish', 'حفظ ونشر')}</button><button className="rounded-xl border border-zinc-200 px-4 text-sm font-black" onClick={() => move(-1)} type="button">↑</button><button className="rounded-xl border border-zinc-200 px-4 text-sm font-black" onClick={() => move(1)} type="button">↓</button>{['hero', 'small_banner'].includes(selected.config.type) ? <><button className="rounded-xl border border-zinc-200 px-4 text-sm font-black" onClick={duplicate} type="button">{t('Duplicate', 'تكرار')}</button><button className="rounded-xl border border-red-200 px-4 text-sm font-black text-red-600" onClick={remove} type="button">{t('Delete', 'حذف')}</button></> : null}</div>
      </div> : null}
    </main>
  </section>;
}

function MediaInput({config, field, label, required, onUpload, t, update, uploading}: {config: Config; field: 'desktop_image' | 'mobile_image'; label: string; required?: boolean; onUpload: (file: File, field: 'desktop_image' | 'mobile_image') => Promise<void>; t: (en: string, ar: string) => string; update: (patch: Partial<Section>, config?: Partial<Config>) => void; uploading: boolean}) {
  const value = config[field] || '', mediaType = field === 'desktop_image' ? config.desktop_media_type : config.mobile_media_type;
  const detectedType = mediaType || mediaTypeForUrl(value), embed = detectedType === 'youtube' ? youtubeEmbed(value) : '';
  return <div className="grid gap-3"><label className={labelClass()}>{label}{required ? ' *' : ''}<input accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm" disabled={uploading} type="file" onChange={(event) => event.target.files?.[0] && void onUpload(event.target.files[0], field)} /></label><input className={inputClass()} dir="ltr" placeholder={t('Or paste an image, MP4/WEBM, or YouTube URL', 'أو ألصق رابط صورة أو MP4/WEBM أو YouTube')} value={value} onChange={(event) => update({is_visible: Boolean(event.target.value.trim())}, {[field]: event.target.value, [field === 'desktop_image' ? 'desktop_media_type' : 'mobile_media_type']: mediaTypeForUrl(event.target.value)})} />{value ? <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-black">{detectedType === 'youtube' && embed ? <iframe allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" referrerPolicy="strict-origin-when-cross-origin" src={embed} title="YouTube hero preview" /> : detectedType === 'video' ? <video autoPlay className="absolute inset-0 h-full w-full object-cover" loop muted playsInline src={value} /> : <FallbackImage alt="" className="absolute inset-0 h-full w-full object-contain" src={value}><span className="grid h-full place-items-center bg-zinc-50 text-sm font-bold text-red-600">{t('Media preview unavailable', 'معاينة الوسائط غير متاحة')}</span></FallbackImage>}</div> : null}</div>;
}

function ItemSelector({config, items, t, update}: {config: Config; items: Row[]; t: (en: string, ar: string) => string; update: (patch: Partial<Section>, config?: Partial<Config>) => void}) {
  const selected = config.item_ids ?? items.map((item) => item.id);
  const toggle = (id: string | number) => update({}, {item_ids: selected.some((value) => String(value) === String(id)) ? selected.filter((value) => String(value) !== String(id)) : [...selected, id]});
  return <div className="grid gap-2"><p className="text-sm font-black">{t('Homepage items', 'عناصر الصفحة الرئيسية')}</p><div className="grid gap-2 sm:grid-cols-2">{items.map((item) => <label className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm font-bold" key={item.id}><input checked={selected.some((value) => String(value) === String(item.id))} onChange={() => toggle(item.id)} type="checkbox" />{item.name_ar || item.name_en}</label>)}</div></div>;
}
