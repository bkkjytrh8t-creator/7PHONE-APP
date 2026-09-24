'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import type {Locale} from '@/lib/types';
import {FallbackImage} from '@/components/FallbackImage';
import {mediaPlatformLabel, parseProductVideoUrl} from '@/lib/productMedia';
import {ProductContentImporter} from './ProductContentImporter';
import {HomepageManager} from './HomepageManager';
import type {ProductContentBlock} from '@/lib/productContent';

type Row = Record<string, any>;
type View = 'dashboard' | 'products' | 'categories' | 'brands' | 'homepage' | 'leads' | 'media' | 'settings' | 'users' | 'activity';
type ProductTab = 'basic' | 'pricing' | 'inventory' | 'images' | 'details' | 'variants' | 'seo';

const nav: Array<{view: View; href: string; en: string; ar: string}> = [
  {view: 'dashboard', href: '/admin', en: 'Dashboard', ar: 'لوحة التحكم'},
  {view: 'products', href: '/admin/products', en: 'Products', ar: 'المنتجات'},
  {view: 'leads', href: '/admin/leads', en: 'Orders / WhatsApp Leads', ar: 'الطلبات / واتساب'},
  {view: 'categories', href: '/admin/categories', en: 'Categories', ar: 'الأقسام'},
  {view: 'brands', href: '/admin/brands', en: 'Brand Management', ar: 'إدارة الماركات'},
  {view: 'homepage', href: '/admin/homepage', en: 'Homepage', ar: 'الصفحة الرئيسية'},
  {view: 'media', href: '/admin/media', en: 'Media Library', ar: 'مكتبة الوسائط'},
  {view: 'settings', href: '/admin/settings', en: 'Store Settings', ar: 'إعدادات المتجر'},
  {view: 'users', href: '/admin/users', en: 'Users & Roles', ar: 'المستخدمون والصلاحيات'},
  {view: 'activity', href: '/admin/activity', en: 'Activity Log', ar: 'سجل النشاط'}
];

const emptyProduct: Row = {
  id: '',
  name_ar: '',
  name_en: '',
  sku: '',
  brand_id: '',
  brand: '',
  category_id: '',
  category: '',
  price_bhd: '',
  old_price_bhd: '',
  cost_price_bhd: '',
  dealer_price_bhd: '',
  tax_percent: '0',
  model: '',
  barcode: '',
  currency: 'BHD',
  warranty: '1 year',
  stock_status: 'available',
  publication_status: 'draft',
  quantity: '',
  low_stock_alert: '0',
  short_description_ar: '',
  short_description_en: '',
  description_ar: '',
  description_en: '',
  features: '',
  details_specifications: '',
  box_contents: '',
  warranty_details: '',
  additional_notes: '',
  colors: '',
  color_options: [],
  storage: '',
  ram: '',
  tags: '',
  is_featured: false,
  is_new: false,
  is_offer: false,
  is_trending: false,
  slug: '',
  meta_title: '',
  meta_description: '',
  image_urls: '',
  hero_banner_image_url: '',
  media_gallery: [],
  product_content_blocks: [],
  variants_enabled: false,
  variants: []
};

const emptyData = {
  products: [] as Row[],
  categories: [] as Row[],
  brands: [] as Row[],
  homepage: [] as Row[],
  settings: {} as Row,
  leads: [] as Row[],
  employees: [] as Row[]
};

const ramOptions = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB'];
const storageOptions = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const simpleRamOptions = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB'];
const simpleStorageOptions = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];
const simpleColors = [
  {name: 'White', hex: '#ffffff'}, {name: 'Black', hex: '#111111'}, {name: 'Blue', hex: '#2563eb'},
  {name: 'Light Blue', hex: '#7dd3fc'}, {name: 'Green', hex: '#22c55e'}, {name: 'Gold', hex: '#d4af37'},
  {name: 'Red', hex: '#ef4444'}, {name: 'Pink', hex: '#ec4899'}, {name: 'Purple', hex: '#9333ea'},
  {name: 'Gray', hex: '#71717a'}, {name: 'Silver', hex: '#c0c0c0'}, {name: 'Brown', hex: '#92400e'},
  {name: 'Orange', hex: '#f97316'}
];

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function lines(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join('\n');
  return typeof value === 'string' ? value : '';
}

function list(value: unknown) {
  return lines(value).split('\n').flatMap((line) => line.split(',')).map((item) => item.trim()).filter(Boolean);
}

function joinList(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean).join('\n');
}

function objectData(row: Row) {
  return row.data && typeof row.data === 'object' ? row.data : {};
}

function price(row: Row) {
  return row.price_bhd ?? row.price ?? '';
}

function statusOf(row: Row) {
  const data = objectData(row);
  if (row.status === 'deleted' || row.stock_status === 'deleted') return 'archived';
  return data.publication_status ?? row.status ?? (row.is_active === false ? 'draft' : 'published');
}

function imageRows(row: Row) {
  return Array.isArray(row.product_images) ? [...row.product_images].sort((a, b) => Number(a.sort_order) - Number(b.sort_order)) : [];
}

function imagesOf(row: Row) {
  const rows = imageRows(row).map((image) => image.url);
  const urls = Array.isArray(row.image_urls) ? row.image_urls : list(row.image_urls);
  return Array.from(new Set([...rows, ...urls].map((url) => String(url).trim()).filter(Boolean)));
}

function labelFor(row: Row, fallback = '-') {
  return text(row.name_ar) || text(row.title_ar) || text(row.name_en) || text(row.title_en) || text(row.name) || text(row.id) || fallback;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function matchesCatalogValue(item: Row, value: unknown) {
  const needle = text(value).toLowerCase();
  if (!needle) return false;

  return [
    item.id,
    item.slug,
    item.name_en,
    item.name_ar
  ].some((candidate) => text(candidate).toLowerCase() === needle);
}

function catalogIdFromProduct(row: Row, rows: Row[], idField: 'brand_id' | 'category_id', textField: 'brand' | 'category') {
  const directId = text(row[idField]);
  if (directId && rows.some((item) => String(item.id) === directId)) {
    return directId;
  }

  const data = objectData(row);
  const savedDataId = text(data[idField]);
  if (savedDataId && rows.some((item) => String(item.id) === savedDataId)) {
    return savedDataId;
  }

  const match = rows.find((item) => matchesCatalogValue(item, row[textField]));
  return match ? String(match.id) : directId || savedDataId || '';
}

function hydrateProduct(row: Row, brands: Row[] = [], categories: Row[] = []): Row {
  const data = objectData(row);
  const savedMedia = Array.isArray(data.media_gallery) ? data.media_gallery : [];
  const savedUrls = new Set(savedMedia.map((item: Row) => text(item.url)));
  const galleryMedia = [
    ...savedMedia,
    ...imageRows(row).filter((image) => !savedUrls.has(text(image.url))).map((image, index) => {
      const parsedVideo = parseProductVideoUrl(text(image.url));
      return {
      id: `${parsedVideo ? 'legacy-video' : 'image'}-${image.id}`,
      product_id: row.id,
      media_type: parsedVideo ? 'video' : 'image',
      source_type: parsedVideo?.source_type ?? 'upload',
      url: image.url,
      thumbnail_url: parsedVideo?.thumbnail_url ?? image.url,
      sort_order: savedMedia.length + index,
      is_primary: !parsedVideo && savedMedia.every((item: Row) => item.media_type !== 'image') && index === 0,
      image_id: image.id
    }})
  ].sort((a, b) => Number(a.sort_order) - Number(b.sort_order)).map((item, index) => ({...item, sort_order: index}));
  const brandId = catalogIdFromProduct(row, brands, 'brand_id', 'brand');
  const categoryId = catalogIdFromProduct(row, categories, 'category_id', 'category');
  return {
    ...emptyProduct,
    id: row.id,
    name_ar: row.name_ar ?? '',
    name_en: row.name_en ?? '',
    sku: data.sku ?? row.sku ?? '',
    brand_id: brandId,
    brand: row.brand ?? '',
    category_id: categoryId,
    category: row.category ?? '',
    price_bhd: row.price_bhd ?? row.price ?? '',
    old_price_bhd: row.old_price_bhd ?? row.old_price ?? '',
    cost_price_bhd: data.cost_price_bhd ?? '',
    dealer_price_bhd: data.dealer_price_bhd ?? '',
    tax_percent: data.tax_percent ?? 0,
    model: data.model ?? '',
    barcode: data.barcode ?? '',
    currency: data.currency ?? 'BHD',
    warranty: row.warranty ?? data.warranty_details ?? '1 year',
    stock_status: row.stock_status ?? 'available',
    publication_status: statusOf(row),
    quantity: data.quantity ?? '',
    low_stock_alert: data.low_stock_alert ?? 0,
    short_description_ar: data.short_description_ar ?? row.short_description_ar ?? '',
    short_description_en: data.short_description_en ?? row.short_description_en ?? '',
    description_ar: row.description_ar ?? '',
    description_en: row.description_en ?? '',
    features: lines(data.features ?? row.features),
    details_specifications: lines(data.details_specifications ?? row.details_specifications ?? row.specifications_en),
    box_contents: lines(data.box_contents ?? row.box_contents),
    warranty_details: data.warranty_details ?? '',
    additional_notes: data.additional_notes ?? '',
    colors: lines(row.colors),
    color_options: Array.isArray(data.color_options) && data.color_options.length
      ? data.color_options
      : lines(row.colors).split('\n').filter(Boolean).map((name) => ({name, hex: '#d4d4d8'})),
    storage: lines(row.storage).trim() || lines(data.storage),
    ram: data.ram ?? '',
    tags: lines(data.tags ?? row.tags),
    is_featured: Boolean(row.is_featured || data.is_featured),
    is_new: Boolean(row.is_new || data.is_new),
    is_offer: Boolean(row.is_offer || data.is_offer),
    is_trending: Boolean(data.is_trending),
    slug: data.slug ?? '',
    slug_history: data.slug_history ?? [],
    meta_title: data.meta_title ?? '',
    meta_description: data.meta_description ?? '',
    image_urls: lines(imagesOf(row)),
    hero_banner_image_url: data.hero_banner_image_url ?? row.hero_banner_image_url ?? '',
    media_gallery: galleryMedia,
    product_content_blocks: data.product_content_blocks ?? data.content_blocks ?? data.product_content ?? data.rich_content ?? [],
    variants_enabled: Boolean(data.variants_enabled ?? (Array.isArray(data.variants) && data.variants.length)),
    variants: Array.isArray(data.variants) ? data.variants : []
  };
}

function inputClass() {
  return 'h-11 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10';
}

function areaClass(tall = false) {
  return cls(inputClass(), tall ? 'min-h-40 py-3 leading-6' : 'min-h-28 py-3 leading-6');
}

function buttonClass(tone: 'primary' | 'quiet' | 'danger' | 'success' = 'quiet') {
  if (tone === 'primary') return 'inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-black disabled:opacity-50';
  if (tone === 'danger') return 'inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50';
  if (tone === 'success') return 'inline-flex h-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50';
  return 'inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50';
}

function cardClass() {
  return 'rounded-lg border border-zinc-200 bg-white shadow-sm';
}

function CreatableSelect({
  label,
  value,
  options,
  onChange,
  multiple = false,
  placeholder
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  multiple?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const values = multiple ? list(value) : [];
  const datalistId = useMemo(() => `admin-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2)}`, [label]);

  function addValue(nextValue = draft) {
    const clean = nextValue.trim();
    if (!clean) return;

    if (multiple) {
      onChange(joinList(Array.from(new Set([...values, clean]))));
      setDraft('');
      return;
    }

    onChange(clean);
  }

  return (
    <div className="grid gap-2">
      {multiple && values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((item) => (
            <button
              className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-800"
              key={item}
              onClick={() => onChange(joinList(values.filter((valueItem) => valueItem !== item)))}
              type="button"
            >
              {item} ×
            </button>
          ))}
        </div>
      ) : null}
      <input
        className={inputClass()}
        list={datalistId}
        placeholder={placeholder}
        value={multiple ? draft : value}
        onBlur={() => multiple && addValue()}
        onChange={(event) => {
          if (multiple) {
            setDraft(event.target.value);
          } else {
            onChange(event.target.value);
          }
        }}
        onKeyDown={(event) => {
          if (!multiple || (event.key !== 'Enter' && event.key !== ',')) return;
          event.preventDefault();
          addValue();
        }}
      />
      <datalist id={datalistId}>
        {options.map((option) => <option key={option} value={option} />)}
      </datalist>
    </div>
  );
}

export function AdminV2({locale, view}: {locale: Locale; view: View}) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [data, setData] = useState(emptyData);
  const [productData, setProductData] = useState<{products: Row[]; categories: Row[]; brands: Row[]}>({products: [], categories: [], brands: []});
  const [message, setMessage] = useState(t('Loading Supabase data...', 'جاري تحميل بيانات Supabase...'));
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setMessage(t('Loading Supabase data...', 'جاري تحميل بيانات Supabase...'));
    const [consoleResponse, productsResponse] = await Promise.all([
      fetch('/api/admin/console', {cache: 'no-store', credentials: 'same-origin'}),
      fetch('/api/admin/product-manager', {cache: 'no-store', credentials: 'same-origin'})
    ]);
    const consoleJson = await consoleResponse.json().catch(() => null);
    const productsJson = await productsResponse.json().catch(() => null);
    if (!consoleResponse.ok || !consoleJson?.ok) {
      setMessage(consoleJson?.message || t('Could not load admin data.', 'تعذر تحميل بيانات الإدارة.'));
      return;
    }
    if (!productsResponse.ok || !productsJson?.ok) {
      setMessage(productsJson?.message || t('Could not load products.', 'تعذر تحميل المنتجات.'));
      return;
    }
    setData(consoleJson.data ?? emptyData);
    setProductData(productsJson.data ?? {products: [], categories: [], brands: []});
    setMessage(t('Synced with Supabase.', 'تمت المزامنة مع Supabase.'));
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function consoleAction(action: string, payload: Row) {
    setBusy(true);
    setMessage(t('Saving...', 'جاري الحفظ...'));
    try {
      const response = await fetch('/api/admin/console', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action, payload})
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setMessage(result?.message || t('Action failed.', 'فشلت العملية.'));
        return false;
      }
      await loadAll();
      setMessage(t('Saved in Supabase.', 'تم الحفظ في Supabase.'));
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/admin/logout', {method: 'POST', credentials: 'same-origin'});
    window.location.assign(`/${locale}/admin/login`);
  }

  const title = nav.find((item) => item.view === view);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950" dir={ar ? 'rtl' : 'ltr'}>
      <aside className="fixed inset-y-0 z-30 hidden w-72 border-zinc-200 bg-white px-4 py-5 shadow-sm lg:block ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l">
        <div className="flex h-full flex-col">
          <div className="px-2">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">7Phone</p>
            <h1 className="mt-1 text-2xl font-black">{t('Admin', 'الإدارة')}</h1>
          </div>
          <nav className="mt-6 grid gap-1">
            {nav.map((item) => (
              <a
                className={cls('rounded-md px-3 py-2.5 text-sm font-black transition', item.view === view ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950')}
                href={`/${locale}${item.href}`}
                key={item.view}
              >
                {ar ? item.ar : item.en}
              </a>
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-bold text-zinc-500">{t('Source of truth', 'مصدر البيانات')}</p>
            <p className="mt-1 text-sm font-black">Supabase</p>
          </div>
        </div>
      </aside>

      <div className="lg:ltr:pl-72 lg:rtl:pr-72">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-zinc-500">7Phone CMS</p>
              <h2 className="truncate text-2xl font-black">{title ? ar ? title.ar : title.en : 'Admin'}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a className={buttonClass()} href={`/${ar ? 'en' : 'ar'}${nav.find((item) => item.view === view)?.href ?? '/admin'}`}>{ar ? 'English' : 'العربية'}</a>
              <button className={buttonClass()} onClick={() => void loadAll()} type="button">{t('Refresh', 'تحديث')}</button>
              <button className={buttonClass('danger')} onClick={() => void signOut()} type="button">{t('Sign out', 'خروج')}</button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <a className={cls('shrink-0 rounded-md px-3 py-2 text-xs font-black', item.view === view ? 'bg-zinc-950 text-white' : 'border border-zinc-200 bg-white text-zinc-700')} href={`/${locale}${item.href}`} key={item.view}>
                {ar ? item.ar : item.en}
              </a>
            ))}
          </nav>
        </header>

        <main className="grid gap-5 px-4 py-5 md:px-6">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700">{message}</div>
          {view === 'dashboard' ? <Dashboard data={data} products={productData.products} t={t} /> : null}
          {view === 'products' ? <ProductsView busy={busy} locale={locale} productData={productData} setBusy={setBusy} setMessage={setMessage} t={t} reload={loadAll} /> : null}
          {view === 'categories' ? <CatalogView kind="category" rows={data.categories} busy={busy} t={t} action={consoleAction} /> : null}
          {view === 'brands' ? <CatalogView kind="brand" rows={data.brands} busy={busy} t={t} action={consoleAction} /> : null}
          {view === 'homepage' ? <HomepageManager rows={data.homepage} products={productData.products} categories={productData.categories} brands={productData.brands} busy={busy} locale={locale} action={consoleAction} /> : null}
          {view === 'leads' ? <LeadsView rows={data.leads} t={t} action={consoleAction} /> : null}
          {view === 'media' ? <MediaView products={productData.products} t={t} /> : null}
          {view === 'settings' ? <SettingsView settings={data.settings ?? {}} busy={busy} t={t} action={consoleAction} /> : null}
          {view === 'users' ? <UsersView rows={data.employees} busy={busy} t={t} action={consoleAction} /> : null}
          {view === 'activity' ? <ActivityView products={productData.products} t={t} /> : null}
        </main>
      </div>
    </div>
  );
}

function Dashboard({data, products, t}: {data: typeof emptyData; products: Row[]; t: (en: string, ar: string) => string}) {
  const stats = [
    [t('Products', 'المنتجات'), products.length],
    [t('Published', 'منشور'), products.filter((item) => statusOf(item) === 'published').length],
    [t('Archived', 'مؤرشف'), products.filter((item) => statusOf(item) === 'archived').length],
    [t('Leads', 'طلبات واتساب'), data.leads.length]
  ];
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value]) => (
        <div className={cls(cardClass(), 'p-5')} key={String(label)}>
          <p className="text-sm font-black text-zinc-500">{label}</p>
          <strong className="mt-2 block text-3xl font-black">{value}</strong>
        </div>
      ))}
    </section>
  );
}

function ProductsView({
  productData,
  locale,
  busy,
  setBusy,
  setMessage,
  reload,
  t
}: {
  productData: {products: Row[]; categories: Row[]; brands: Row[]};
  locale: Locale;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setMessage: (value: string) => void;
  reload: () => Promise<void>;
  t: (en: string, ar: string) => string;
}) {
  const [form, setForm] = useState<Row>(emptyProduct);
  const [tab, setTab] = useState<ProductTab>('basic');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [brand, setBrand] = useState('all');
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [sort, setSort] = useState('newest');
  const [files, setFiles] = useState<FileList | null>(null);
  const [slotFiles, setSlotFiles] = useState<Array<File | null>>([null, null, null]);
  const [slotPreviews, setSlotPreviews] = useState<string[]>(['', '', '']);
  const [slotUrls, setSlotUrls] = useState<string[]>(['', '', '']);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customStorage, setCustomStorage] = useState('');
  const [customRam, setCustomRam] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragMediaId, setDragMediaId] = useState<string | null>(null);
  const [quickImport, setQuickImport] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const quickImportRef = useRef<HTMLTextAreaElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const defaults = {information: true, pricing: true, variants: false, media: false, specifications: false, description: false, full_content: false, seo: false, publishing: false};
    if (typeof window === 'undefined') return defaults;
    try {
      return {...defaults, ...JSON.parse(window.localStorage.getItem('7phone-product-editor-sections') || '{}')};
    } catch {
      return defaults;
    }
  });
  const activeProduct = productData.products.find((item) => Number(item.id) === Number(form.id));
  const activeImages = activeProduct ? imageRows(activeProduct) : [];
  const simpleImages = (Array.isArray(form.media_gallery) ? form.media_gallery : [])
    .filter((item: Row) => item.media_type === 'image')
    .slice(0, 3);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...productData.products].filter((product) => {
      const data = objectData(product);
      const matchesQuery = !needle || [product.name_ar, product.name_en, product.id, data.sku].join(' ').toLowerCase().includes(needle);
      const matchesStatus = status === 'all' || statusOf(product) === status;
      const matchesBrand = brand === 'all' || String(product.brand_id) === brand || String(product.brand) === brand;
      const matchesCategory = category === 'all' || String(product.category_id) === category || String(product.category) === category;
      const matchesAvailability = availability === 'all' || String(product.stock_status) === availability;
      return matchesQuery && matchesStatus && matchesBrand && matchesCategory && matchesAvailability;
    }).sort((a, b) => {
      if (sort === 'oldest') return Date.parse(a.created_at ?? '') - Date.parse(b.created_at ?? '');
      if (sort === 'price') return Number(price(a) || 0) - Number(price(b) || 0);
      if (sort === 'name') return String(a.name_en || a.name_ar).localeCompare(String(b.name_en || b.name_ar));
      return Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '');
    });
  }, [availability, brand, category, productData.products, query, sort, status]);

  function update(field: string, value: unknown) {
    setForm((current) => ({...current, [field]: value}));
    setSaveState('dirty');
  }

  function toggleSimpleValue(field: 'storage' | 'ram', value: string) {
    const current = list(form[field]);
    update(field, joinList(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function toggleSimpleColor(option: {name: string; hex: string}) {
    const current = Array.isArray(form.color_options) ? form.color_options : [];
    const selected = current.some((item: Row) => text(item.name).toLowerCase() === option.name.toLowerCase());
    const next = selected ? current.filter((item: Row) => text(item.name).toLowerCase() !== option.name.toLowerCase()) : [...current, option];
    setForm((value) => ({...value, color_options: next, colors: joinList(next.map((item: Row) => text(item.name)))}));
    setSaveState('dirty');
  }

  function setImageUrl(index: number, url: string) {
    const gallery = Array.isArray(form.media_gallery) ? [...form.media_gallery] : [];
    const images = gallery.filter((item: Row) => item.media_type === 'image');
    const existing = images[index];
    const nextItem = {id: existing?.id || `image-external-${Date.now()}-${index}`, product_id: Number(form.id) || null, media_type: 'image', source_type: 'external_url', url, thumbnail_url: url, sort_order: index, is_primary: index === 0, image_id: existing?.image_id};
    if (existing) gallery[gallery.indexOf(existing)] = nextItem;
    else gallery.push(nextItem);
    const orderedImages = gallery.filter((item: Row) => item.media_type === 'image').slice(0, 3).map((item: Row, itemIndex: number) => ({...item, sort_order: itemIndex, is_primary: itemIndex === 0}));
    const otherMedia = gallery.filter((item: Row) => item.media_type !== 'image');
    update('media_gallery', [...orderedImages, ...otherMedia.map((item: Row, itemIndex: number) => ({...item, sort_order: orderedImages.length + itemIndex}))]);
  }

  async function removeSimpleImage(index: number) {
    const target = simpleImages[index];
    const storedImage = target ? activeImages.find((item) => Number(item.id) === Number(target.image_id) || text(item.url) === text(target.url)) : null;
    if (storedImage && form.id) {
      const response = await fetch('/api/admin/console/images', {method: 'DELETE', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({productId: form.id, id: storedImage.id})});
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setMessage(result?.message || t('Image delete failed.', 'فشل حذف الصورة.'));
        return;
      }
    }
    if (target) update('media_gallery', (Array.isArray(form.media_gallery) ? form.media_gallery : []).filter((item: Row) => item !== target).map((item: Row, itemIndex: number) => ({...item, sort_order: itemIndex, is_primary: item.media_type === 'image' && itemIndex === 0})));
    setSlotFiles((current) => current.map((file, itemIndex) => itemIndex === index ? null : file));
    setSlotPreviews((current) => current.map((url, itemIndex) => itemIndex === index ? '' : url));
    setSlotUrls((current) => current.map((url, itemIndex) => itemIndex === index ? '' : url));
  }

  function updateBrand(value: string) {
    const selected = productData.brands.find((item) => String(item.id) === String(value));
    setForm((current) => ({
      ...current,
      brand_id: value,
      brand: value ? text(selected?.name_en) || current.brand : ''
    }));
    setSaveState('dirty');
  }

  function updateCategory(value: string) {
    const selected = productData.categories.find((item) => String(item.id) === String(value));
    setForm((current) => ({
      ...current,
      category_id: value,
      category: value ? text(selected?.slug) || text(selected?.name_en) || current.category : ''
    }));
    setSaveState('dirty');
  }

  function toggleSection(key: string) {
    setOpenSections((current) => {
      const next = {...current, [key]: !current[key]};
      window.localStorage.setItem('7phone-product-editor-sections', JSON.stringify(next));
      return next;
    });
  }

  function parseQuickSpecifications() {
    const source = quickImport.replace(/\r/g, '');
    const valueFor = (labels: string[]) => {
      const match = source.match(new RegExp(`(?:^|\\n)\\s*(?:${labels.join('|')})\\s*[:：-]\\s*([^\\n]+)`, 'i'));
      return match?.[1]?.trim() ?? '';
    };
    const detected = [
      ['Display', valueFor(['Display', 'Screen'])],
      ['Android', valueFor(['Android', 'Android Version', 'OS'])],
      ['Battery', valueFor(['Battery'])],
      ['RAM', valueFor(['RAM', 'Memory'])],
      ['Storage', valueFor(['Storage', 'ROM'])],
      ['Rear Camera', valueFor(['Rear Camera', 'Main Camera'])],
      ['Front Camera', valueFor(['Front Camera', 'Selfie Camera'])],
      ['Network', valueFor(['Network'])]
    ].filter(([, value]) => value);
    if (/\bNFC\b/i.test(source)) detected.push(['NFC', 'Yes']);
    if (/dual\s*sim/i.test(source)) detected.push(['Dual SIM', 'Yes']);
    const ramValue = detected.find(([key]) => key === 'RAM')?.[1] ?? '';
    const storageValue = detected.find(([key]) => key === 'Storage')?.[1] ?? '';
    setForm((current) => ({
      ...current,
      details_specifications: detected.map(([key, value]) => `${key}: ${value}`).join('\n'),
      ram: ramValue || current.ram,
      storage: storageValue || current.storage,
      features: joinList(Array.from(new Set([...list(current.features), ...detected.filter(([key]) => key === 'NFC' || key === 'Dual SIM').map(([key]) => key)])))
    }));
    setSaveState('dirty');
    setOpenSections((current) => ({...current, specifications: true}));
    setMessage(detected.length ? t(`${detected.length} specifications detected.`, `تم اكتشاف ${detected.length} مواصفات.`) : t('No supported specifications were detected.', 'لم يتم اكتشاف مواصفات مدعومة.'));
  }

  async function productAction(action: string, payload: Row) {
    setBusy(true);
    if (action === 'saveProduct') setSaveState('saving');
    setMessage(t('Saving product...', 'جاري حفظ المنتج...'));
    try {
      const response = await fetch('/api/admin/product-manager', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action, payload})
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setMessage(result?.message || t('Product action failed.', 'فشلت عملية المنتج.'));
        if (action === 'saveProduct') setSaveState('dirty');
        return null;
      }
      await reload();
      setMessage(t('Product saved in Supabase.', 'تم حفظ المنتج في Supabase.'));
      const saved = result.data?.savedProductId ? result.data.products?.find((item: Row) => Number(item.id) === Number(result.data.savedProductId)) : null;
      if (saved) setForm(hydrateProduct(saved, productData.brands, productData.categories));
      if (action === 'saveProduct') setSaveState('saved');
      return result.data;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!text(form.name_ar) && !text(form.name_en)) {
      setMessage(t('Product name is required.', 'اسم المنتج مطلوب.'));
      setTab('basic');
      return;
    }
    if (!Number.isFinite(Number(form.price_bhd)) || Number(form.price_bhd) <= 0) {
      setMessage(t('Price must be greater than zero.', 'السعر يجب أن يكون أكبر من صفر.'));
      setTab('pricing');
      return;
    }
    if (form.id && !(Array.isArray(form.media_gallery) && form.media_gallery.some((item: Row) => item.media_type === 'image' && text(item.url))) && !slotFiles.some(Boolean)) {
      setMessage(t('Choose a main product image before saving.', 'اختر صورة رئيسية للمنتج قبل الحفظ.'));
      setOpenSections((current) => ({...current, media: true}));
      return;
    }
    const duplicateSku = text(form.sku) && productData.products.some((product) => text(objectData(product).sku).toLowerCase() === text(form.sku).toLowerCase() && Number(product.id) !== Number(form.id));
    if (duplicateSku) {
      setMessage(t('SKU already exists. Choose a unique SKU.', 'رقم SKU موجود مسبقًا. اختر رقمًا مختلفًا.'));
      setTab('inventory');
      return;
    }
    const variants = Array.isArray(form.variants) ? form.variants : [];
    const combinationKeys = variants.map((variant: Row) => [text(variant.color_en || variant.color), text(variant.storage), text(variant.ram)].map((value) => value.toLowerCase()).join('|'));
    const variantSkus = variants.map((variant: Row) => text(variant.sku).toLowerCase()).filter(Boolean);
    if (new Set(combinationKeys).size !== combinationKeys.length || new Set(variantSkus).size !== variantSkus.length) {
      setMessage(t('Variant combinations and SKUs must be unique.', 'يجب ألا تتكرر تركيبات المتغيرات أو أرقام SKU.'));
      setTab('variants');
      return;
    }
    if (form.variants_enabled && variants.length && !variants.some((variant: Row) => variant.available !== false && Number(variant.stock) > 0)) {
      setMessage(t('At least one enabled variant must be in stock.', 'يجب أن يتوفر متغير واحد على الأقل في المخزون.'));
      setTab('variants');
      return;
    }
    const selectedBrand = productData.brands.find((item) => String(item.id) === String(form.brand_id));
    const selectedCategory = productData.categories.find((item) => String(item.id) === String(form.category_id));
    const payload: Row = {
      ...form,
      brand_id: text(form.brand_id),
      category_id: text(form.category_id),
      brand: text(selectedBrand?.name_en) || text(form.brand),
      category: text(selectedCategory?.slug) || text(selectedCategory?.name_en) || text(form.category),
      slug: text(form.slug) || slugify(text(form.name_en) || text(form.name_ar) || `product-${Date.now()}`),
      slug_history: form.slug ? Array.from(new Set([...(Array.isArray(form.slug_history) ? form.slug_history : []), form.slug])) : form.slug_history,
      variants_enabled: Boolean(form.variants_enabled),
      variants
    };
    const savedData = await productAction('saveProduct', payload);
    const savedId = Number(savedData?.savedProductId ?? form.id);
    if (!savedData || !savedId) return;

    const pending = slotFiles.map((file, index) => ({file, index})).filter((item): item is {file: File; index: number} => Boolean(item.file));
    if (pending.length) {
      setBusy(true);
      setSaveState('saving');
      setMessage(t('Uploading product images...', 'جاري رفع صور المنتج...'));
      try {
        const nextGallery = Array.isArray(payload.media_gallery) ? [...payload.media_gallery] : [];
        for (const {file, index} of pending) {
          const oldMedia = nextGallery.filter((item: Row) => item.media_type === 'image')[index];
          const oldStored = oldMedia ? activeImages.find((item) => Number(item.id) === Number(oldMedia.image_id) || text(item.url) === text(oldMedia.url)) : null;
          if (oldStored) await fetch('/api/admin/console/images', {method: 'DELETE', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({productId: savedId, id: oldStored.id})});
          const body = new FormData();
          body.set('productId', String(savedId));
          body.append('files', file);
          const response = await fetch('/api/admin/console/images', {method: 'POST', credentials: 'same-origin', body});
          const result = await response.json().catch(() => null);
          if (!response.ok || !result?.ok || !result.urls?.[0]) throw new Error(result?.message || t('Image upload failed.', 'فشل رفع الصورة.'));
          const images = nextGallery.filter((item: Row) => item.media_type === 'image');
          const replacement = {id: `image-upload-${Date.now()}-${index}`, product_id: savedId, media_type: 'image', source_type: 'upload', url: result.urls[0], thumbnail_url: result.urls[0], sort_order: index, is_primary: index === 0};
          if (images[index]) nextGallery[nextGallery.indexOf(images[index])] = replacement;
          else nextGallery.push(replacement);
        }
        const orderedImages = nextGallery.filter((item: Row) => item.media_type === 'image').slice(0, 3).map((item: Row, index: number) => ({...item, sort_order: index, is_primary: index === 0}));
        const otherMedia = nextGallery.filter((item: Row) => item.media_type !== 'image').map((item: Row, index: number) => ({...item, sort_order: orderedImages.length + index}));
        const finalData = await productAction('saveProduct', {...payload, id: savedId, media_gallery: [...orderedImages, ...otherMedia]});
        if (!finalData) throw new Error(t('Images uploaded, but the final product save failed.', 'تم رفع الصور، لكن فشل الحفظ النهائي للمنتج.'));
        setSlotFiles([null, null, null]);
        setSlotPreviews(['', '', '']);
        await reload();
      } catch (error) {
        setSaveState('dirty');
        setMessage(error instanceof Error ? error.message : t('Image upload failed.', 'فشل رفع الصور.'));
        return;
      } finally {
        setBusy(false);
      }
    }
    setSaveState('saved');
    setMessage(t('Product saved successfully.', 'تم حفظ المنتج بنجاح.'));
  }

  useEffect(() => {
    if (saveState !== 'dirty' || !form.id || busy) return;
    const timer = window.setTimeout(() => void save(), 30_000);
    return () => window.clearTimeout(timer);
  }, [form, saveState, busy]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
      if (event.key.toLowerCase() === 'd' && form.id) {
        event.preventDefault();
        void productAction('duplicateProduct', {id: form.id});
      }
      if (event.shiftKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        quickImportRef.current?.focus();
        quickImportRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [form, saveState, busy]);

  async function uploadImages() {
    if (!form.id || !files?.length) {
      setMessage(t('Save the product first, then upload images.', 'احفظ المنتج أولًا ثم ارفع الصور.'));
      return;
    }
    const body = new FormData();
    body.set('productId', String(form.id));
    Array.from(files).forEach((file) => body.append('files', file));
    setBusy(true);
    const response = await fetch('/api/admin/console/images', {method: 'POST', credentials: 'same-origin', body});
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !result?.ok) {
      setMessage(result?.message || t('Image upload failed.', 'فشل رفع الصور.'));
      return;
    }
    setFiles(null);
    const uploadedMedia = (result.urls ?? []).map((url: string, index: number) => ({
      id: `image-upload-${Date.now()}-${index}`,
      product_id: Number(form.id),
      media_type: 'image',
      source_type: 'upload',
      url,
      thumbnail_url: url,
      sort_order: (Array.isArray(form.media_gallery) ? form.media_gallery.length : 0) + index,
      is_primary: !(Array.isArray(form.media_gallery) && form.media_gallery.some((item: Row) => item.media_type === 'image'))
    }));
    setForm((current) => ({...current, media_gallery: [...(Array.isArray(current.media_gallery) ? current.media_gallery : []), ...uploadedMedia]}));
    await reload();
    setMessage(t('Images uploaded to Supabase Storage.', 'تم رفع الصور إلى Supabase Storage.'));
  }

  async function deleteImage(image: Row) {
    if (!window.confirm(t('Delete this image?', 'حذف هذه الصورة؟'))) return;
    const response = await fetch('/api/admin/console/images', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({productId: form.id, id: image.id})
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setMessage(result?.message || t('Image delete failed.', 'فشل حذف الصورة.'));
      return;
    }
    setForm((current) => ({...current, media_gallery: (Array.isArray(current.media_gallery) ? current.media_gallery : []).filter((item: Row) => text(item.url) !== text(image.url))}));
    await reload();
  }

  async function uploadHeroImage() {
    if (!form.id || !heroFile) {
      setMessage(t('Save the product first, then choose a hero image.', 'احفظ المنتج أولًا ثم اختر صورة البانر.'));
      return;
    }
    const body = new FormData();
    body.set('productId', String(form.id));
    body.set('file', heroFile);
    setBusy(true);
    const response = await fetch('/api/admin/product-hero-image', {method: 'POST', credentials: 'same-origin', body});
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !result?.ok) {
      setMessage(result?.message || t('Hero image upload failed.', 'فشل رفع صورة البانر.'));
      return;
    }
    setHeroFile(null);
    setForm((current) => ({...current, hero_banner_image_url: result.url}));
    await reload();
    setMessage(t('Hero banner image uploaded.', 'تم رفع صورة بانر المنتج.'));
  }

  async function deleteHeroImage() {
    if (!form.id || !text(form.hero_banner_image_url) || !window.confirm(t('Delete the hero banner image?', 'حذف صورة بانر المنتج؟'))) return;
    setBusy(true);
    const response = await fetch('/api/admin/product-hero-image', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({productId: form.id})
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !result?.ok) {
      setMessage(result?.message || t('Hero image delete failed.', 'فشل حذف صورة البانر.'));
      return;
    }
    setForm((current) => ({...current, hero_banner_image_url: ''}));
    await reload();
    setMessage(t('Hero image removed. The main product image is now used.', 'تم حذف صورة البانر. سيتم استخدام صورة المنتج الرئيسية.'));
  }

  async function addExternalImage() {
    if (!form.id || !text(externalUrl)) return;
    await productAction('addExternalImage', {id: form.id, url: text(externalUrl)});
    const url = text(externalUrl);
    setForm((current) => ({...current, media_gallery: [...(Array.isArray(current.media_gallery) ? current.media_gallery : []), {
      id: `image-external-${Date.now()}`,
      product_id: Number(form.id),
      media_type: 'image',
      source_type: 'external_url',
      url,
      thumbnail_url: url,
      sort_order: Array.isArray(current.media_gallery) ? current.media_gallery.length : 0,
      is_primary: !(Array.isArray(current.media_gallery) && current.media_gallery.some((item: Row) => item.media_type === 'image'))
    }]}));
    setExternalUrl('');
  }

  async function addVideo() {
    const parsed = parseProductVideoUrl(videoUrl);
    if (!parsed) {
      setVideoError(t('Invalid or unsupported video URL', 'رابط الفيديو غير صالح أو غير مدعوم'));
      return;
    }
    if (!form.id) {
      setVideoError(t('Save the product before adding a video.', 'احفظ المنتج قبل إضافة الفيديو.'));
      return;
    }
    const gallery = Array.isArray(form.media_gallery) ? form.media_gallery : [];
    if (gallery.some((item: Row) => item.media_type === 'video' && text(item.url) === parsed.url)) {
      setVideoError(t('This video is already in the gallery.', 'هذا الفيديو موجود بالفعل في المعرض.'));
      return;
    }
    const nextGallery = [...gallery, {
      id: `video-${Date.now()}`,
      product_id: Number(form.id),
      media_type: 'video',
      source_type: parsed.source_type,
      url: parsed.url,
      thumbnail_url: parsed.thumbnail_url,
      sort_order: gallery.length,
      is_primary: false,
      status: 'active',
      created_at: new Date().toISOString()
    }];
    const saved = await productAction('saveProduct', {...form, media_gallery: nextGallery});
    if (!saved) {
      setVideoError(t('The video could not be saved.', 'تعذر حفظ الفيديو.'));
      return;
    }
    setVideoUrl('');
    setVideoError('');
    setMessage(t('Video saved to the product and is now available publicly.', 'تم حفظ الفيديو في المنتج وأصبح متاحًا للعامة.'));
  }

  async function uploadVideo() {
    if (!form.id || !videoFile) {
      setVideoError(t('Save the product and choose an MP4 or WebM file first.', 'احفظ المنتج واختر ملف MP4 أو WebM أولًا.'));
      return;
    }
    setBusy(true);
    const response = await fetch('/api/admin/product-video', {
      method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({productId: form.id, type: videoFile.type, size: videoFile.size})
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setBusy(false);
      setVideoError(result?.message || t('Video upload failed.', 'فشل رفع الفيديو.'));
      return;
    }
    const uploadBody = new FormData();
    uploadBody.append('cacheControl', '3600');
    uploadBody.append('', videoFile);
    const upload = await fetch(result.signedUrl, {method: 'POST', headers: {'x-upsert': 'false'}, body: uploadBody});
    setBusy(false);
    if (!upload.ok) {
      const uploadError = await upload.json().catch(() => null);
      setVideoError(uploadError?.message || t('Video upload failed.', 'فشل رفع الفيديو.'));
      return;
    }
    result.url = result.publicUrl;
    setVideoFile(null);
    setVideoUrl(result.url);
    const parsed = parseProductVideoUrl(result.url);
    if (!parsed) {
      setVideoError(t('Uploaded video URL is invalid.', 'رابط الفيديو المرفوع غير صالح.'));
      return;
    }
    const gallery = Array.isArray(form.media_gallery) ? form.media_gallery : [];
    await productAction('saveProduct', {...form, media_gallery: [...gallery, {
      id: `video-${Date.now()}`, product_id: Number(form.id), media_type: 'video', source_type: parsed.source_type,
      url: parsed.url, thumbnail_url: '', sort_order: gallery.length, is_primary: false, status: 'active', created_at: new Date().toISOString()
    }]});
    setVideoUrl('');
  }

  function removeVideo(id: string) {
    update('media_gallery', (Array.isArray(form.media_gallery) ? form.media_gallery : []).filter((item: Row) => text(item.id) !== id).map((item: Row, index: number) => ({...item, sort_order: index})));
  }

  function makePrimaryImage(id: string) {
    const gallery = (Array.isArray(form.media_gallery) ? form.media_gallery : []).map((item: Row) => ({...item, is_primary: item.media_type === 'image' && text(item.id) === id}));
    const primaryIndex = gallery.findIndex((item: Row) => item.is_primary);
    if (primaryIndex > 0) gallery.unshift(gallery.splice(primaryIndex, 1)[0]);
    update('media_gallery', gallery.map((item: Row, index: number) => ({...item, sort_order: index})));
  }

  function reorderMedia(targetId: string) {
    if (!dragMediaId || dragMediaId === targetId) return;
    const gallery = [...(Array.isArray(form.media_gallery) ? form.media_gallery : [])];
    const from = gallery.findIndex((item: Row) => text(item.id) === dragMediaId);
    const to = gallery.findIndex((item: Row) => text(item.id) === targetId);
    if (from < 0 || to < 0) return;
    gallery.splice(to, 0, gallery.splice(from, 1)[0]);
    const primaryIndex = gallery.findIndex((item: Row) => item.media_type === 'image' && item.is_primary);
    if (primaryIndex > 0) gallery.unshift(gallery.splice(primaryIndex, 1)[0]);
    update('media_gallery', gallery.map((item: Row, index: number) => ({...item, sort_order: index})));
    setDragMediaId(null);
  }

  async function reorderImages(targetId: number) {
    if (!dragId || dragId === targetId) return;
    const ids = activeImages.map((image) => Number(image.id));
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await productAction('reorderImages', {id: form.id, imageIds: ids});
    setDragId(null);
  }

  const tabs: Array<[ProductTab, string]> = [
    ['basic', t('Basic Info', 'المعلومات الأساسية')],
    ['pricing', t('Pricing', 'التسعير')],
    ['inventory', t('Inventory', 'المخزون')],
    ['images', t('Images', 'الصور')],
    ['details', t('Product Details', 'تفاصيل المنتج')],
    ['variants', t('Variants', 'المتغيرات')],
    ['seo', 'SEO']
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(620px,760px)]">
      <div className="grid content-start gap-4">
        <div className={cls(cardClass(), 'p-4')}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input className={inputClass()} placeholder={t('Search name or SKU', 'بحث بالاسم أو SKU')} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className={inputClass()} value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">{t('All brands', 'كل الماركات')}</option>{productData.brands.map((item) => <option key={item.id} value={item.id}>{item.name_en}</option>)}</select>
            <select className={inputClass()} value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{t('All categories', 'كل الأقسام')}</option>{productData.categories.map((item) => <option key={item.id} value={item.id}>{item.name_en}</option>)}</select>
            <select className={inputClass()} value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">{t('Availability', 'التوفر')}</option><option value="available">{t('Available', 'متوفر')}</option><option value="out-of-stock">{t('Out of stock', 'غير متوفر')}</option><option value="hidden">{t('Hidden', 'مخفي')}</option></select>
            <select className={inputClass()} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t('All status', 'كل الحالات')}</option><option value="published">{t('Published', 'منشور')}</option><option value="draft">{t('Draft', 'مسودة')}</option><option value="archived">{t('Archived', 'مؤرشف')}</option></select>
            <select className={inputClass()} value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">{t('Newest', 'الأحدث')}</option><option value="oldest">{t('Oldest', 'الأقدم')}</option><option value="price">{t('Price', 'السعر')}</option><option value="name">{t('Name', 'الاسم')}</option></select>
          </div>
          <p className="mt-3 text-sm font-black text-zinc-500">{filtered.length} {t('products', 'منتج')}</p>
        </div>

        <div className={cls(cardClass(), 'overflow-hidden')}>
          <div className="hidden grid-cols-[76px_minmax(220px,1fr)_120px_120px_100px_120px_220px] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-black uppercase text-zinc-500 xl:grid">
            <span>{t('Image', 'الصورة')}</span><span>{t('Product', 'المنتج')}</span><span>SKU</span><span>{t('Brand', 'الماركة')}</span><span>{t('Price', 'السعر')}</span><span>{t('Status', 'الحالة')}</span><span>{t('Actions', 'إجراءات')}</span>
          </div>
          {filtered.map((product) => {
            const productMeta = objectData(product);
            const archived = statusOf(product) === 'archived';
            return (
              <article className="grid gap-3 border-b border-zinc-200 p-4 last:border-b-0 xl:grid-cols-[76px_minmax(220px,1fr)_120px_120px_100px_120px_220px] xl:items-center" key={product.id}>
                <FallbackImage alt={product.name_en || product.name_ar || ''} className="h-16 w-16 rounded-md object-cover" src={imagesOf(product)[0]}>
                  <div className="grid h-16 w-16 place-items-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-400">{t('No image', 'لا صورة')}</div>
                </FallbackImage>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{product.name_ar || '-'}</strong>
                  <span className="block truncate text-sm font-semibold text-zinc-500">{product.name_en || '-'}</span>
                </div>
                <span className="text-sm font-bold text-zinc-600">{productMeta.sku || '-'}</span>
                <span className="text-sm font-bold text-zinc-600">{product.brand || '-'}</span>
                <span className="text-sm font-black">BHD {price(product) || '-'}</span>
                <span className={cls('w-fit rounded-full px-2 py-1 text-xs font-black', archived ? 'bg-zinc-100 text-zinc-600' : statusOf(product) === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{statusOf(product)}</span>
                <div className="flex flex-wrap gap-2">
                  <button className={buttonClass()} onClick={() => {setForm(hydrateProduct(product, productData.brands, productData.categories)); setSaveState('saved');}} type="button">{t('Edit', 'تعديل')}</button>
                  <a className={buttonClass()} href={`/${locale}/product/${product.id}`} target="_blank">{t('Preview', 'معاينة')}</a>
                  {archived
                    ? <button className={buttonClass('success')} onClick={() => void productAction('restoreProduct', {id: product.id})} type="button">{t('Restore', 'استرجاع')}</button>
                    : <button className={buttonClass()} onClick={() => void productAction('archiveProduct', {id: product.id})} type="button">{t('Archive', 'أرشفة')}</button>}
                  <button className={buttonClass('danger')} disabled={!archived || busy} onClick={() => archived && window.confirm(t('Delete archived product permanently?', 'حذف المنتج المؤرشف نهائيًا؟')) && void productAction('deleteProduct', {id: product.id})} type="button">{t('Delete', 'حذف')}</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className={cls(cardClass(), 'grid content-start gap-4 p-4 md:p-5')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-zinc-500">{form.id ? `#${form.id}` : t('New product', 'منتج جديد')}</p>
            <h3 className="truncate text-xl font-black">{form.name_ar || form.name_en || t('Untitled', 'بدون اسم')}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cls('rounded-full px-3 py-1 text-xs font-black', saveState === 'saved' ? 'bg-emerald-50 text-emerald-700' : saveState === 'saving' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700')}>{saveState === 'saved' ? t('Saved ✓', 'تم الحفظ ✓') : saveState === 'saving' ? t('Saving…', 'جارٍ الحفظ…') : t('Unsaved Changes', 'تغييرات غير محفوظة')}</span>
            {form.id ? <button className={buttonClass()} onClick={() => void productAction('duplicateProduct', {id: form.id})} type="button">{t('Duplicate Product', 'تكرار المنتج')}</button> : null}
            <button className={buttonClass()} onClick={() => {setForm(emptyProduct); setSaveState('saved');}} type="button">{t('New', 'جديد')}</button>
          </div>
        </div>

        <div className="grid gap-5">
          <section className="grid gap-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
            <Field label={t('Product Name', 'اسم المنتج')} required>
              <input className="h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-lg font-bold outline-none transition focus:border-brand-neon focus:ring-4 focus:ring-fuchsia-100" value={locale === 'ar' ? form.name_ar : form.name_en} onChange={(event) => update(locale === 'ar' ? 'name_ar' : 'name_en', event.target.value)} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Selling Price', 'سعر البيع')} required><input className="h-14 w-full rounded-xl border border-zinc-300 px-4 text-lg font-black outline-none focus:border-brand-neon focus:ring-4 focus:ring-fuchsia-100" min="0" step=".001" type="number" value={form.price_bhd} onChange={(event) => update('price_bhd', event.target.value)} /></Field>
              <Field label={t('Old Price (optional)', 'السعر القديم (اختياري)')}><input className="h-14 w-full rounded-xl border border-zinc-300 px-4 text-lg font-black outline-none focus:border-brand-neon focus:ring-4 focus:ring-fuchsia-100" min="0" step=".001" type="number" value={form.old_price_bhd} onChange={(event) => update('old_price_bhd', event.target.value)} /></Field>
            </div>

            <div className="grid gap-2">
              <h4 className="text-sm font-black">{t('Product Images', 'صور المنتج')}</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((index) => {
                  const saved = simpleImages[index];
                  const preview = slotPreviews[index] || text(saved?.thumbnail_url) || text(saved?.url);
                  return <section className="grid content-start gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-3" key={index}>
                    <div className="flex items-center justify-between"><strong className="text-sm">{t(`IMAGE ${index + 1}`, `الصورة ${index + 1}`)}</strong>{index === 0 ? <span className="rounded-full bg-fuchsia-100 px-2 py-1 text-[10px] font-black text-brand-neon">{t('MAIN', 'رئيسية')}</span> : null}</div>
                    <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-white">
                      {preview ? <FallbackImage alt="" className="h-full w-full object-contain" src={preview}><span className="text-xs text-zinc-400">{t('Invalid image', 'صورة غير صالحة')}</span></FallbackImage> : <span className="text-3xl text-zinc-300">＋</span>}
                    </div>
                    <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-zinc-950 px-3 text-center text-xs font-black text-white">
                      {preview ? t('Replace image', 'استبدال الصورة') : t('Upload from computer', 'رفع من الكمبيوتر')}
                      <input accept="image/jpeg,image/png,image/webp" className="hidden" type="file" onChange={(event) => {const file = event.target.files?.[0] ?? null; if (!file) return; setSlotFiles((current) => current.map((item, itemIndex) => itemIndex === index ? file : item)); setSlotPreviews((current) => current.map((item, itemIndex) => itemIndex === index ? URL.createObjectURL(file) : item)); setSaveState('dirty');}} />
                    </label>
                    <input aria-label={t(`Image ${index + 1} URL`, `رابط الصورة ${index + 1}`)} className="h-11 min-w-0 rounded-xl border border-zinc-300 bg-white px-3 text-xs outline-none focus:border-brand-neon" dir="ltr" placeholder="https://..." value={slotUrls[index]} onChange={(event) => setSlotUrls((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} onBlur={() => {if (text(slotUrls[index])) setImageUrl(index, text(slotUrls[index]));}} onKeyDown={(event) => {if (event.key === 'Enter') {event.preventDefault(); if (text(slotUrls[index])) setImageUrl(index, text(slotUrls[index]));}}} />
                    {preview ? <button className="h-10 rounded-xl border border-red-200 bg-white text-xs font-black text-red-600" onClick={() => void removeSimpleImage(index)} type="button">{t('Delete image', 'حذف الصورة')}</button> : null}
                  </section>;
                })}
              </div>
            </div>

            <SimpleChoices custom={customStorage} label={t('Storage / GB', 'السعة / GB')} options={simpleStorageOptions} selected={list(form.storage)} setCustom={setCustomStorage} onToggle={(value) => toggleSimpleValue('storage', value)} onAdd={() => {if (text(customStorage)) {toggleSimpleValue('storage', text(customStorage)); setCustomStorage('');}}} t={t} />
            <SimpleChoices custom={customRam} label="RAM" options={simpleRamOptions} selected={list(form.ram)} setCustom={setCustomRam} onToggle={(value) => toggleSimpleValue('ram', value)} onAdd={() => {if (text(customRam)) {toggleSimpleValue('ram', text(customRam)); setCustomRam('');}}} t={t} />

            <div className="grid gap-3">
              <h4 className="text-sm font-black">{t('Colors', 'الألوان')}</h4>
              <div className="flex flex-wrap gap-2">{simpleColors.map((option) => {const selected = (Array.isArray(form.color_options) ? form.color_options : []).some((item: Row) => text(item.name).toLowerCase() === option.name.toLowerCase()); return <button aria-pressed={selected} className={cls('flex min-h-12 items-center gap-2 rounded-full border-2 px-3 text-xs font-black transition', selected ? 'border-brand-neon bg-fuchsia-50 text-brand-neon' : 'border-zinc-200 bg-white')} key={option.name} onClick={() => toggleSimpleColor(option)} type="button"><span className="h-7 w-7 rounded-full border border-black/10 shadow-inner" style={{backgroundColor: option.hex}} />{option.name}</button>;})}</div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className={inputClass()} placeholder={t('Custom Color', 'لون مخصص')} value={customColor} onChange={(event) => setCustomColor(event.target.value)} onKeyDown={(event) => {if (event.key === 'Enter') {event.preventDefault(); if (text(customColor)) {toggleSimpleColor({name: text(customColor), hex: '#d4d4d8'}); setCustomColor('');}}}} /><button className={buttonClass()} onClick={() => {if (text(customColor)) {toggleSimpleColor({name: text(customColor), hex: '#d4d4d8'}); setCustomColor('');}}} type="button">{t('Add', 'إضافة')}</button></div>
            </div>

            <LinkedVariantsEditor form={form} update={update} t={t} />

            <Field label={t('Short Specifications / Caption', 'المواصفات المختصرة')}>
              <textarea className="min-h-44 w-full resize-y rounded-xl border border-zinc-300 bg-white p-4 text-base font-semibold leading-8 outline-none focus:border-brand-neon focus:ring-4 focus:ring-fuchsia-100" placeholder={t('Paste product specifications here...', 'ألصق مواصفات المنتج هنا...')} value={lines(form.specifications_ar)} onChange={(event) => update('specifications_ar', event.target.value)} />
            </Field>

            <Field label={t('Stock Quantity', 'كمية المخزون')}><input className="h-14 w-full rounded-xl border border-zinc-300 px-4 text-lg font-black outline-none focus:border-brand-neon focus:ring-4 focus:ring-fuchsia-100" min="0" step="1" type="number" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} /></Field>

            <button aria-expanded={advancedOpen} className="flex min-h-14 w-full items-center justify-between rounded-xl border border-zinc-300 bg-zinc-50 px-4 text-base font-black" onClick={() => setAdvancedOpen((value) => !value)} type="button"><span>{t('Advanced Settings', 'إعدادات متقدمة')}</span><span className="text-brand-neon">{advancedOpen ? '−' : '+'}</span></button>
          </section>
        </div>

        {advancedOpen ? <>
        <section className="grid gap-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-4">
          <div><p className="text-xs font-black uppercase tracking-wide text-brand-neon">FAST ENTRY</p><h3 className="mt-1 text-xl font-black">{t('📋 Quick Product Import', '📋 استيراد سريع للمنتج')}</h3><p className="mt-1 text-sm font-semibold text-zinc-600">{t('Paste supplier specifications and fill matching fields automatically.', 'ألصق مواصفات المورد لتعبئة الحقول المطابقة تلقائيًا.')}</p></div>
          <textarea ref={quickImportRef} className={areaClass(true)} placeholder={'Display: 6.6 IPS HD+\nAndroid: 15\nBattery: 5000mAh\nRAM: 12GB\nStorage: 128GB\nRear Camera: 32MP\nDual SIM\nNFC'} value={quickImport} onChange={(event) => setQuickImport(event.target.value)} />
          <button className={buttonClass('primary')} disabled={!quickImport.trim()} onClick={parseQuickSpecifications} type="button">{t('✨ Parse Specifications', '✨ تحليل المواصفات')}</button>
        </section>

        <LiveProductPreview form={form} locale={locale} brands={productData.brands} />

        <div className="grid gap-3">
          <AccordionSection id="information" open={openSections.information !== false} title={t('1. Product Information', '1. معلومات المنتج')} onToggle={() => toggleSection('information')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Brand', 'الماركة')}><select className={inputClass()} value={form.brand_id} onChange={(event) => updateBrand(event.target.value)}><option value="">{t('Select brand', 'اختر ماركة')}</option>{productData.brands.map((item) => <option key={item.id} value={item.id}>{item.name_en}</option>)}</select></Field>
              <Field label={t('Category', 'القسم')}><select className={inputClass()} value={form.category_id} onChange={(event) => updateCategory(event.target.value)}><option value="">{t('Select category', 'اختر قسم')}</option>{productData.categories.map((item) => <option key={item.id} value={item.id}>{item.name_en}</option>)}</select></Field>
              <Field label={t('Arabic product name', 'اسم المنتج بالعربية')} required><input className={inputClass()} value={form.name_ar} onChange={(event) => update('name_ar', event.target.value)} /></Field>
              <Field label={t('English product name', 'اسم المنتج بالإنجليزية')} required><input className={inputClass()} value={form.name_en} onChange={(event) => update('name_en', event.target.value)} /></Field>
              <Field label={t('Model', 'الموديل')}><input className={inputClass()} value={form.model} onChange={(event) => update('model', event.target.value)} /></Field>
              <Field label="SKU"><input className={inputClass()} dir="ltr" value={form.sku} onChange={(event) => update('sku', event.target.value)} /></Field>
              <Field label={t('Barcode', 'الباركود')}><input className={inputClass()} dir="ltr" value={form.barcode} onChange={(event) => update('barcode', event.target.value)} /></Field>
              <Field label={t('Warranty', 'الضمان')}><input className={inputClass()} value={form.warranty} onChange={(event) => update('warranty', event.target.value)} /></Field>
              <Field label={t('Availability', 'التوفر')}><select className={inputClass()} value={form.stock_status} onChange={(event) => update('stock_status', event.target.value)}><option value="available">{t('Available', 'متوفر')}</option><option value="out-of-stock">{t('Out of stock', 'غير متوفر')}</option><option value="hidden">{t('Hidden', 'مخفي')}</option></select></Field>
              <Field label={t('Stock quantity', 'كمية المخزون')}><input className={inputClass()} min="0" type="number" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} /></Field>
            </div>
          </AccordionSection>

          <AccordionSection id="pricing" open={openSections.pricing !== false} title={t('2. Pricing', '2. التسعير')} onToggle={() => toggleSection('pricing')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Cost Price', 'سعر التكلفة')}><input className={inputClass()} min="0" step=".001" type="number" value={form.cost_price_bhd} onChange={(event) => update('cost_price_bhd', event.target.value)} /></Field>
              <Field label={t('Selling Price', 'سعر البيع')} required><input className={inputClass()} min="0" step=".001" type="number" value={form.price_bhd} onChange={(event) => update('price_bhd', event.target.value)} /></Field>
              <Field label={t('Old Price', 'السعر القديم')}><input className={inputClass()} min="0" step=".001" type="number" value={form.old_price_bhd} onChange={(event) => update('old_price_bhd', event.target.value)} /></Field>
              <Field label={t('Dealer Price', 'سعر الجملة')}><input className={inputClass()} min="0" step=".001" type="number" value={form.dealer_price_bhd} onChange={(event) => update('dealer_price_bhd', event.target.value)} /></Field>
              <Field label={t('Tax %', 'الضريبة %')}><input className={inputClass()} min="0" step=".01" type="number" value={form.tax_percent} onChange={(event) => update('tax_percent', event.target.value)} /></Field>
            </div>
            <ProfitSummary cost={Number(form.cost_price_bhd)} price={Number(form.price_bhd)} tax={Number(form.tax_percent)} t={t} />
          </AccordionSection>

          <AccordionSection id="variants" open={Boolean(openSections.variants)} title={t('3. Variants', '3. المتغيرات')} onToggle={() => toggleSection('variants')}><VariantEditor form={form} update={update} t={t} /></AccordionSection>

          <AccordionSection id="media" open={Boolean(openSections.media)} title={t('4. Media', '4. الوسائط')} onToggle={() => toggleSection('media')}>
            <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-5 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {event.preventDefault(); setFiles(event.dataTransfer.files);}}><p className="font-black">{t('Drag & drop product images', 'اسحب صور المنتج هنا')}</p><input accept="image/jpeg,image/png,image/webp" className="mt-3 max-w-full text-sm" multiple type="file" onChange={(event) => setFiles(event.target.files)} /><button className={cls(buttonClass('primary'), 'mt-3')} disabled={!files || !form.id} onClick={() => void uploadImages()} type="button">{t('Upload Images', 'رفع الصور')}</button></div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className={inputClass()} placeholder="https:// image URL" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /><button className={buttonClass()} onClick={() => void addExternalImage()} type="button">{t('Add Image URL', 'إضافة رابط صورة')}</button></div>
            <div className="grid gap-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 p-4"><h4 className="font-black">{t('Product Video', 'فيديو المنتج')}</h4><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className={inputClass()} dir="ltr" placeholder="YouTube, Instagram, TikTok, MP4…" value={videoUrl} onChange={(event) => {setVideoUrl(event.target.value); setVideoError('');}} /><button className={buttonClass('primary')} onClick={() => void addVideo()} type="button">{t('Add Video URL', 'إضافة رابط فيديو')}</button></div><div className="flex flex-wrap items-center gap-2"><input accept="video/mp4,video/webm" className="max-w-full text-sm" type="file" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} /><button className={buttonClass()} disabled={!videoFile || !form.id} onClick={() => void uploadVideo()} type="button">{t('Upload MP4/WebM', 'رفع MP4/WebM')}</button></div>{videoError ? <p className="text-sm font-black text-red-600">{videoError}</p> : null}</div>
            <MediaManager form={form} activeImages={activeImages} dragMediaId={dragMediaId} setDragMediaId={setDragMediaId} reorderMedia={reorderMedia} makePrimaryImage={makePrimaryImage} deleteImage={deleteImage} removeVideo={removeVideo} t={t} />
          </AccordionSection>

          <AccordionSection id="specifications" open={Boolean(openSections.specifications)} title={t('5. Specifications', '5. المواصفات')} onToggle={() => toggleSection('specifications')}>
            <SpecificationRows value={form.details_specifications} onChange={(value) => update('details_specifications', value)} t={t} />
            <div className="grid gap-3 sm:grid-cols-2"><Field label={t('Features', 'المميزات')}><textarea className={areaClass()} value={form.features} onChange={(event) => update('features', event.target.value)} /></Field><Field label={t('Box contents', 'محتويات العلبة')}><textarea className={areaClass()} value={form.box_contents} onChange={(event) => update('box_contents', event.target.value)} /></Field><Field label={t('Product colors', 'ألوان المنتج')}><div className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">{(Array.isArray(form.color_options) ? form.color_options : []).map((option: Row, index: number) => <div className="grid grid-cols-[48px_1fr_auto] items-center gap-2" key={`${index}-${option.name}`}><input aria-label={t('Color picker', 'اختيار اللون')} className="h-11 w-12 rounded-lg border border-zinc-300 bg-white p-1" type="color" value={/^#[0-9a-f]{6}$/i.test(text(option.hex)) ? option.hex : '#d4d4d8'} onChange={(event) => { const next = [...form.color_options]; next[index] = {...option, hex: event.target.value}; update('color_options', next); }} /><input className={inputClass()} placeholder={t('Color name', 'اسم اللون')} value={option.name || ''} onChange={(event) => { const next = [...form.color_options]; next[index] = {...option, name: event.target.value}; setForm((current) => ({...current, color_options: next, colors: next.map((item) => text(item.name)).filter(Boolean).join('\n')})); setSaveState('dirty'); }} /><button aria-label={t('Delete color', 'حذف اللون')} className="h-11 rounded-lg border border-red-200 px-3 font-black text-red-600" onClick={() => { const next = form.color_options.filter((_: Row, itemIndex: number) => itemIndex !== index); setForm((current) => ({...current, color_options: next, colors: next.map((item: Row) => text(item.name)).filter(Boolean).join('\n')})); setSaveState('dirty'); }} type="button">×</button></div>)}<button className="h-11 rounded-xl border border-brand-neon bg-white text-sm font-black text-brand-neon" onClick={() => update('color_options', [...(Array.isArray(form.color_options) ? form.color_options : []), {name: '', hex: '#d4d4d8'}])} type="button">+ {t('Add color', 'إضافة لون')}</button></div></Field><Field label="Storage"><CreatableSelect label="Storage" options={storageOptions} value={form.storage} onChange={(value) => update('storage', value)} /></Field><Field label="RAM"><CreatableSelect label="RAM" options={ramOptions} value={form.ram} onChange={(value) => update('ram', value)} /></Field></div>
          </AccordionSection>

          <AccordionSection id="description" open={Boolean(openSections.description)} title={t('6. Description', '6. الوصف')} onToggle={() => toggleSection('description')}>
            <RichTextField label={t('Arabic Description', 'الوصف العربي')} value={form.description_ar} onChange={(value) => update('description_ar', value)} />
            <RichTextField label={t('English Description', 'الوصف الإنجليزي')} value={form.description_en} onChange={(value) => update('description_en', value)} />
          </AccordionSection>

          <AccordionSection id="full-content" open={Boolean(openSections.full_content)} title={t('Full Product Page Import', 'استيراد صفحة المنتج كاملة')} onToggle={() => toggleSection('full_content')}>
            <ProductContentImporter
              blocks={form.product_content_blocks}
              busy={busy}
              locale={locale}
              productId={form.id}
              setMessage={setMessage}
              onChange={(blocks: ProductContentBlock[]) => update('product_content_blocks', blocks)}
              onSave={async (blocks: ProductContentBlock[]) => Boolean(await productAction('saveProduct', {...form, product_content_blocks: blocks}))}
            />
          </AccordionSection>

          <AccordionSection id="seo" open={Boolean(openSections.seo)} title="7. SEO" onToggle={() => toggleSection('seo')}><div className="grid gap-3 sm:grid-cols-2"><Field label="Slug"><input className={inputClass()} dir="ltr" value={form.slug} onChange={(event) => update('slug', event.target.value)} /></Field><Field label={t('Meta title', 'عنوان SEO')}><input className={inputClass()} value={form.meta_title} onChange={(event) => update('meta_title', event.target.value)} /></Field></div><Field label={t('Meta description', 'وصف SEO')}><textarea className={areaClass()} value={form.meta_description} onChange={(event) => update('meta_description', event.target.value)} /></Field></AccordionSection>

          <AccordionSection id="publishing" open={Boolean(openSections.publishing)} title={t('8. Publishing', '8. النشر')} onToggle={() => toggleSection('publishing')}><div className="grid gap-3 sm:grid-cols-2"><Field label={t('Status', 'الحالة')}><select className={inputClass()} value={form.publication_status} onChange={(event) => update('publication_status', event.target.value)}><option value="draft">{t('Draft', 'مسودة')}</option><option value="published">{t('Published', 'منشور')}</option><option value="archived">{t('Archived', 'مؤرشف')}</option></select></Field>{[['is_featured', t('Featured', 'مميز')], ['is_new', t('New', 'جديد')], ['is_offer', t('Offer', 'عرض')], ['is_trending', t('Trending', 'رائج')]].map(([key, label]) => <label className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-black" key={key}><input checked={Boolean(form[key])} onChange={(event) => update(key, event.target.checked)} type="checkbox" />{label}</label>)}</div></AccordionSection>
        </div>
        </> : null}
        <div className="sticky bottom-3 z-20 grid gap-2 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center"><p className="text-xs font-bold text-zinc-500">{t('Autosaves 30 seconds after changes · Ctrl/⌘+S to save', 'حفظ تلقائي بعد 30 ثانية · Ctrl/⌘+S للحفظ')}</p><button className={buttonClass('primary')} disabled={busy} onClick={() => void save()} type="button">{busy ? t('Saving...', 'جاري الحفظ...') : t('Save Product', 'حفظ المنتج')}</button></div>
      </aside>
    </section>
  );
}

function SimpleChoices({label, options, selected, custom, setCustom, onToggle, onAdd, t}: {label: string; options: string[]; selected: string[]; custom: string; setCustom: (value: string) => void; onToggle: (value: string) => void; onAdd: () => void; t: (en: string, ar: string) => string}) {
  return <div className="grid gap-3"><h4 className="text-sm font-black">{label}</h4><div className="flex flex-wrap gap-2">{options.map((option) => <button aria-pressed={selected.includes(option)} className={cls('min-h-12 rounded-xl border-2 px-4 text-sm font-black transition', selected.includes(option) ? 'border-brand-neon bg-fuchsia-50 text-brand-neon' : 'border-zinc-200 bg-white text-zinc-800')} key={option} onClick={() => onToggle(option)} type="button">{option}</button>)}</div><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className={inputClass()} placeholder={`${t('Custom', 'مخصص')} ${label}`} value={custom} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => {if (event.key === 'Enter') {event.preventDefault(); onAdd();}}} /><button className={buttonClass()} onClick={onAdd} type="button">{t('Add', 'إضافة')}</button></div></div>;
}

function LinkedVariantsEditor({form, update, t}: {form: Row; update: (field: string, value: unknown) => void; t: (en: string, ar: string) => string}) {
  const variants = Array.isArray(form.variants) ? form.variants : [];
  const storages = list(form.storage);
  const ramValues = list(form.ram);
  const colors = (Array.isArray(form.color_options) ? form.color_options : []).map((item: Row) => text(item.name)).filter(Boolean);
  const change = (index: number, field: string, value: unknown) => update('variants', variants.map((variant: Row, itemIndex: number) => itemIndex === index ? {...variant, [field]: value} : variant));
  const add = () => update('variants', [...variants, {
    id: `variant-${Date.now()}`,
    storage: storages[0] ?? '',
    ram: ramValues[0] ?? '',
    color_en: colors[0] ?? '',
    color_hex: (Array.isArray(form.color_options) ? form.color_options : []).find((item: Row) => text(item.name) === colors[0])?.hex ?? '#d4d4d8',
    price_bhd: form.price_bhd,
    stock: form.quantity || 0,
    available: true,
    is_default: variants.length === 0
  }]);

  return <section className="grid gap-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/40 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h4 className="font-black">{t('Linked Variants', 'الخيارات المرتبطة')}</h4><p className="mt-1 text-xs font-semibold text-zinc-500">{t('Link each Storage, RAM and Color combination to its own price and stock.', 'اربط كل تركيبة سعة وRAM ولون بسعرها ومخزونها.')}</p></div>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-3 text-sm font-black"><input checked={Boolean(form.variants_enabled)} onChange={(event) => update('variants_enabled', event.target.checked)} type="checkbox" />{t('Enable', 'تفعيل')}</label>
    </div>
    {form.variants_enabled ? <>
      {variants.map((variant: Row, index: number) => <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6" key={variant.id || index}>
        <Field label={t('Storage', 'السعة')}><select className={inputClass()} value={variant.storage ?? ''} onChange={(event) => change(index, 'storage', event.target.value)}><option value="">—</option>{storages.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
        <Field label="RAM"><select className={inputClass()} value={variant.ram ?? ''} onChange={(event) => change(index, 'ram', event.target.value)}><option value="">—</option>{ramValues.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
        <Field label={t('Color', 'اللون')}><select className={inputClass()} value={variant.color_en ?? variant.color ?? ''} onChange={(event) => {const name = event.target.value; const hex = (Array.isArray(form.color_options) ? form.color_options : []).find((item: Row) => text(item.name) === name)?.hex; update('variants', variants.map((item: Row, itemIndex: number) => itemIndex === index ? {...item, color_en: name, color: name, color_hex: hex || item.color_hex} : item));}}><option value="">{t('Any color', 'أي لون')}</option>{colors.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
        <Field label={t('Price', 'السعر')}><input className={inputClass()} min="0" step=".001" type="number" value={variant.price_bhd ?? ''} onChange={(event) => change(index, 'price_bhd', event.target.value)} /></Field>
        <Field label={t('Stock', 'المخزون')}><input className={inputClass()} min="0" step="1" type="number" value={variant.stock ?? ''} onChange={(event) => change(index, 'stock', event.target.value)} /></Field>
        <div className="grid content-end gap-2"><label className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-black"><input checked={variant.available !== false} onChange={(event) => change(index, 'available', event.target.checked)} type="checkbox" />{t('Available', 'متوفر')}</label><button className="h-10 rounded-xl border border-red-200 text-xs font-black text-red-600" onClick={() => update('variants', variants.filter((_: Row, itemIndex: number) => itemIndex !== index))} type="button">{t('Delete', 'حذف')}</button></div>
      </div>)}
      <button className="min-h-12 rounded-xl border-2 border-dashed border-brand-neon bg-white px-4 text-sm font-black text-brand-neon" onClick={add} type="button">+ {t('Add linked combination', 'إضافة تركيبة مرتبطة')}</button>
    </> : null}
  </section>;
}

function AccordionSection({id, title, open, onToggle, children}: {id: string; title: string; open: boolean; onToggle: () => void; children: ReactNode}) {
  return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
    <button aria-controls={`product-section-${id}`} aria-expanded={open} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start text-base font-black transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-neon" onClick={onToggle} type="button"><span>{title}</span><span className="text-xl text-brand-neon">{open ? '−' : '+'}</span></button>
    {open ? <div className="grid gap-4 border-t border-zinc-100 p-4" id={`product-section-${id}`}>{children}</div> : null}
  </section>;
}

function ProfitSummary({cost, price, tax, t}: {cost: number; price: number; tax: number; t: (en: string, ar: string) => string}) {
  const netPrice = Number.isFinite(price) ? price / (1 + Math.max(0, tax) / 100) : 0;
  const profit = Math.max(0, netPrice - (Number.isFinite(cost) ? cost : 0));
  const margin = netPrice > 0 ? profit / netPrice * 100 : 0;
  return <div className="grid gap-3 rounded-xl bg-zinc-950 p-4 text-white sm:grid-cols-2"><div><p className="text-xs font-black text-white/55">{t('PROFIT', 'الربح')}</p><strong className="mt-1 block text-2xl">BHD {profit.toFixed(3)}</strong></div><div><p className="text-xs font-black text-white/55">{t('PROFIT %', 'نسبة الربح')}</p><strong className="mt-1 block text-2xl text-brand-neon">{margin.toFixed(1)}%</strong></div></div>;
}

function SpecificationRows({value, onChange, t}: {value: string; onChange: (value: string) => void; t: (en: string, ar: string) => string}) {
  const rows = lines(value).split('\n').filter(Boolean).map((line, index) => {
    const separator = line.indexOf(':');
    return {id: `${index}-${line}`, key: separator >= 0 ? line.slice(0, separator).trim() : line.trim(), value: separator >= 0 ? line.slice(separator + 1).trim() : ''};
  });
  const commit = (next: Array<{key: string; value: string}>) => onChange(next.filter((row) => row.key || row.value).map((row) => `${row.key}: ${row.value}`).join('\n'));
  return <div className="grid gap-2">{rows.map((row, index) => <div className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2 sm:grid-cols-[28px_1fr_1fr_auto] sm:items-center" draggable key={row.id} onDragStart={(event) => event.dataTransfer.setData('text/spec-index', String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {event.preventDefault(); const from = Number(event.dataTransfer.getData('text/spec-index')); if (!Number.isInteger(from) || from === index) return; const next = rows.map(({key, value}) => ({key, value})); next.splice(index, 0, next.splice(from, 1)[0]); commit(next);}}><span className="cursor-grab text-center font-black text-zinc-400">⋮⋮</span><input aria-label={t('Specification key', 'اسم المواصفة')} className={inputClass()} placeholder={t('Display', 'الشاشة')} value={row.key} onChange={(event) => commit(rows.map((item, itemIndex) => ({key: itemIndex === index ? event.target.value : item.key, value: item.value})))} /><input aria-label={t('Specification value', 'قيمة المواصفة')} className={inputClass()} placeholder="6.6 IPS" value={row.value} onChange={(event) => commit(rows.map((item, itemIndex) => ({key: item.key, value: itemIndex === index ? event.target.value : item.value})))} /><button className={buttonClass('danger')} onClick={() => commit(rows.filter((_, itemIndex) => itemIndex !== index))} type="button">{t('Delete', 'حذف')}</button></div>)}<button className={buttonClass()} onClick={() => commit([...rows.map(({key, value}) => ({key, value})), {key: t('New specification', 'مواصفة جديدة'), value: ''}])} type="button">{t('+ Add Row', '+ إضافة صف')}</button></div>;
}

function RichTextField({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const insert = (before: string, after = '') => {
    const element = textarea.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    onChange(`${value.slice(0, start)}${before}${value.slice(start, end)}${after}${value.slice(end)}`);
    window.setTimeout(() => element.focus(), 0);
  };
  return <Field label={label}><div className="overflow-hidden rounded-xl border border-zinc-300 bg-white"><div className="flex gap-1 border-b border-zinc-200 bg-zinc-50 p-2"><button className="h-8 min-w-8 rounded-md font-black hover:bg-white" onClick={() => insert('**', '**')} type="button">B</button><button className="h-8 min-w-8 rounded-md italic hover:bg-white" onClick={() => insert('_', '_')} type="button">I</button><button className="h-8 min-w-8 rounded-md hover:bg-white" onClick={() => insert('\n• ')} type="button">•</button></div><textarea ref={textarea} className="min-h-40 w-full resize-y border-0 p-3 text-sm font-semibold leading-7 outline-none" value={value} onChange={(event) => onChange(event.target.value)} /></div></Field>;
}

function LiveProductPreview({form, locale, brands}: {form: Row; locale: Locale; brands: Row[]}) {
  const gallery = Array.isArray(form.media_gallery) ? form.media_gallery : [];
  const image = gallery.find((item: Row) => item.media_type === 'image' && item.is_primary)?.url || gallery.find((item: Row) => item.media_type === 'image')?.url;
  const brand = brands.find((item) => String(item.id) === String(form.brand_id));
  return <section className="sticky top-3 z-10 grid grid-cols-[112px_1fr] gap-4 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur"><div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-[#f5f5f7]"><FallbackImage alt="" className="h-full w-full object-contain p-2" src={image}><span className="text-xs font-black text-zinc-400">NO IMAGE</span></FallbackImage></div><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black uppercase text-brand-neon">{locale === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}</p><span className="text-[10px] font-bold text-zinc-400">{brand?.name_en || form.brand || '7Phone'}</span></div><h4 className="mt-2 truncate text-lg font-black">{(locale === 'ar' ? form.name_ar : form.name_en) || form.name_ar || form.name_en || (locale === 'ar' ? 'اسم المنتج' : 'Product name')}</h4><p className="mt-2 text-2xl font-black text-brand-neon">BHD {Number(form.price_bhd || 0).toFixed(3)}</p><p className="mt-1 text-xs font-bold text-zinc-500">{form.model || form.sku || '—'}</p></div></section>;
}

function MediaManager({form, activeImages, setDragMediaId, reorderMedia, makePrimaryImage, deleteImage, removeVideo, t}: {form: Row; activeImages: Row[]; dragMediaId: string | null; setDragMediaId: (value: string | null) => void; reorderMedia: (id: string) => void; makePrimaryImage: (id: string) => void; deleteImage: (image: Row) => Promise<void>; removeVideo: (id: string) => void; t: (en: string, ar: string) => string}) {
  return <div className="grid gap-3 sm:grid-cols-2">{(Array.isArray(form.media_gallery) ? form.media_gallery : []).map((media: Row, index: number) => {const isVideo = media.media_type === 'video'; const image = activeImages.find((item) => Number(item.id) === Number(media.image_id) || text(item.url) === text(media.url)); return <article className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm" draggable key={media.id} onDragStart={() => setDragMediaId(text(media.id))} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderMedia(text(media.id))}><div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100"><FallbackImage alt="" className="h-full w-full object-contain" src={text(media.thumbnail_url) || text(media.url)}><div className="grid h-full place-items-center text-3xl">{isVideo ? '▶' : '🖼️'}</div></FallbackImage>{isVideo ? <span className="absolute inset-0 grid place-items-center text-4xl text-brand-neon">▶</span> : null}<span className="absolute start-2 top-2 rounded bg-black/75 px-2 py-1 text-[10px] font-black text-white">{isVideo ? mediaPlatformLabel(media.source_type) : t('Image', 'صورة')}</span></div><div className="mt-2 flex items-center justify-between"><span className="cursor-grab text-zinc-400">⋮⋮ #{index + 1}</span>{media.is_primary ? <span className="text-xs font-black text-brand-neon">{t('Cover', 'الغلاف')}</span> : null}</div><div className="mt-2 flex gap-2">{!isVideo && !media.is_primary ? <button className={buttonClass()} onClick={() => makePrimaryImage(text(media.id))} type="button">{t('Set Cover', 'تعيين غلاف')}</button> : null}<button className={buttonClass('danger')} onClick={() => image ? void deleteImage(image) : removeVideo(text(media.id))} type="button">{t('Delete', 'حذف')}</button></div></article>;})}</div>;
}

function VariantEditor({form, update, t}: {form: Row; update: (key: string, value: unknown) => void; t: (en: string, ar: string) => string}) {
  const variants = Array.isArray(form.variants) ? form.variants : [];
  const change = (index: number, field: string, value: unknown) => {
    const next = [...variants];
    next[index] = {...next[index], [field]: value};
    if (field === 'is_default' && value) next.forEach((variant, itemIndex) => { if (itemIndex !== index) variant.is_default = false; });
    update('variants', next);
  };
  async function uploadVariantImages(index: number, files: FileList | null) {
    if (!form.id || !files?.length) return;
    const body = new FormData();
    body.set('productId', String(form.id));
    body.set('variantId', variants[index].sku || variants[index].id || `variant-${index + 1}`);
    Array.from(files).forEach((file) => body.append('files', file));
    const response = await fetch('/api/admin/variant-images', {method: 'POST', credentials: 'same-origin', body});
    const result = await response.json().catch(() => null);
    if (response.ok && result?.ok) change(index, 'images', Array.from(new Set([...list(variants[index].images), ...result.urls])));
    else window.alert(result?.message || t('Image upload failed.', 'فشل رفع الصور.'));
  }
  async function removeVariantImage(index: number, url: string) {
    if (url.includes(`/storage/v1/object/public/`)) {
      const response = await fetch('/api/admin/variant-images', {method: 'DELETE', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url})});
      if (!response.ok) return;
    }
    change(index, 'images', list(variants[index].images).filter((image) => image !== url));
  }
  return (
    <Panel title={t('Product variants', 'متغيرات المنتج')}>
      <label className="flex items-center gap-3 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm font-black">
        <input checked={Boolean(form.variants_enabled)} onChange={(event) => update('variants_enabled', event.target.checked)} type="checkbox" />
        {t('Enable variants for this product', 'تفعيل المتغيرات لهذا المنتج')}
      </label>
      {variants.map((variant: Row, index: number) => (
        <section className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm" key={variant.id || index}>
          <div className="flex items-center justify-between gap-3"><h4 className="font-black">{t('Combination', 'التركيبة')} #{index + 1}</h4><span className={cls('rounded-full px-2 py-1 text-[10px] font-black', variant.available !== false && Number(variant.stock) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}>{variant.available !== false && Number(variant.stock) > 0 ? t('Available', 'متوفر') : t('Unavailable', 'غير متوفر')}</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('Color name (English)', 'اسم اللون (إنجليزي)')}><input className={inputClass()} value={variant.color_en ?? variant.color ?? ''} onChange={(event) => change(index, 'color_en', event.target.value)} /></Field>
            <Field label={t('Color name (Arabic)', 'اسم اللون (عربي)')}><input className={inputClass()} value={variant.color_ar ?? ''} onChange={(event) => change(index, 'color_ar', event.target.value)} /></Field>
            <Field label={t('Color swatch', 'درجة اللون')}><input className="h-11 w-full rounded-md border border-zinc-300 bg-white p-1" type="color" value={variant.color_hex || '#d4d4d8'} onChange={(event) => change(index, 'color_hex', event.target.value)} /></Field>
            <Field label={t('Storage', 'السعة')}><CreatableSelect label={`variant-storage-${index}`} options={storageOptions} placeholder="256GB" value={variant.storage ?? ''} onChange={(value) => change(index, 'storage', value)} /></Field>
            <Field label="RAM"><CreatableSelect label={`variant-ram-${index}`} options={ramOptions} placeholder="8GB" value={variant.ram ?? ''} onChange={(value) => change(index, 'ram', value)} /></Field>
            <Field label="SKU"><input className={inputClass()} dir="ltr" value={variant.sku ?? ''} onChange={(event) => change(index, 'sku', event.target.value)} /></Field>
            <Field label={t('Exact price (BHD)', 'السعر الدقيق (د.ب)')}><input className={inputClass()} min="0" step="0.001" type="number" value={variant.price_bhd ?? ''} onChange={(event) => change(index, 'price_bhd', event.target.value)} /></Field>
            <Field label={t('Old price (optional)', 'السعر السابق (اختياري)')}><input className={inputClass()} min="0" step="0.001" type="number" value={variant.old_price_bhd ?? ''} onChange={(event) => change(index, 'old_price_bhd', event.target.value)} /></Field>
            <Field label={t('Stock', 'المخزون')}><input className={inputClass()} min="0" step="1" type="number" value={variant.stock ?? ''} onChange={(event) => change(index, 'stock', event.target.value)} /></Field>
            <Field label={t('Warranty', 'الضمان')}><input className={inputClass()} value={variant.warranty ?? ''} onChange={(event) => change(index, 'warranty', event.target.value)} /></Field>
          </div>
          <Field label={t('Color/variant image URLs — one per line', 'روابط صور اللون/المتغير — رابط في كل سطر')}><textarea className={areaClass()} value={lines(variant.images)} onChange={(event) => change(index, 'images', list(event.target.value))} /></Field>
          <Field label={t('Upload color images', 'رفع صور اللون')}><input accept="image/jpeg,image/png,image/webp" disabled={!form.id} multiple type="file" onChange={(event) => void uploadVariantImages(index, event.target.files)} /><p className="mt-1 text-xs text-zinc-500">{form.id ? t('JPG, PNG or WebP; up to 4 MB each.', 'JPG أو PNG أو WebP؛ حتى 4MB للصورة.') : t('Save the product first.', 'احفظ المنتج أولاً.')}</p></Field>
          {list(variant.images).length ? <div className="flex gap-2 overflow-x-auto">{list(variant.images).map((url) => <div className="relative h-24 w-24 shrink-0" key={url}><FallbackImage alt="" className="h-full w-full rounded-lg border border-zinc-200 object-cover" src={url}><div className="h-full w-full bg-zinc-100" /></FallbackImage><button aria-label={t('Remove image', 'حذف الصورة')} className="absolute end-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white" onClick={() => void removeVariantImage(index, url)} type="button">×</button></div>)}</div> : null}
          <div className="flex flex-wrap gap-3">
            {[['available', t('Available', 'متوفر')], ['is_default', t('Default', 'افتراضي')], ['most_popular', t('Most popular', 'الأكثر طلبًا')]].map(([field, label]) => <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-black" key={field}><input checked={variant[field] !== false && (field === 'available' || Boolean(variant[field]))} onChange={(event) => change(index, field, event.target.checked)} type="checkbox" />{label}</label>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClass()} onClick={() => update('variants', [...variants.slice(0, index + 1), {...variant, id: '', sku: '', is_default: false}, ...variants.slice(index + 1)])} type="button">{t('Duplicate', 'تكرار')}</button>
            <button className={buttonClass('danger')} onClick={() => update('variants', variants.filter((_: Row, itemIndex: number) => itemIndex !== index))} type="button">{t('Delete', 'حذف')}</button>
          </div>
        </section>
      ))}
      <button className={buttonClass('primary')} onClick={() => update('variants', [...variants, {id: `variant-${Date.now()}`, color_en: '', color_ar: '', color_hex: '#d4d4d8', storage: '', ram: '', price_bhd: form.price_bhd, old_price_bhd: '', stock: 0, sku: '', available: true, is_default: variants.length === 0, most_popular: false, images: []}])} type="button">{t('Add combination', 'إضافة تركيبة')}</button>
    </Panel>
  );
}

function CatalogView({kind, rows, busy, t, action}: {kind: 'category' | 'brand'; rows: Row[]; busy: boolean; t: (en: string, ar: string) => string; action: (action: string, payload: Row) => Promise<boolean>}) {
  const empty = kind === 'category' ? {id: '', name_ar: '', name_en: '', slug: '', icon: '', sort_order: '0', is_visible: true} : {id: '', name_ar: '', name_en: '', slug: '', logo_url: '', homepage_url: '', sort_order: '0', is_visible: true};
  const [form, setForm] = useState<Row>(empty);
  const [draggedId, setDraggedId] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState('');
  const [logoMessage, setLogoMessage] = useState('');
  const saveAction = kind === 'category' ? 'saveCategory' : 'saveBrand';
  const deleteAction = kind === 'category' ? 'deleteCategory' : 'deleteBrand';
  const logoUrl = text(form.logo_url);

  useEffect(() => {
    if (!logoFile) {
      setLocalLogoPreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(logoFile);
    setLocalLogoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  async function uploadLogo() {
    if (!logoFile) {
      setLogoMessage(t('Choose a logo image first.', 'اختر صورة الشعار أولًا.'));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(logoFile.type)) {
      setLogoMessage(t('Logo must be JPG, PNG, WEBP, or SVG.', 'الشعار يجب أن يكون JPG أو PNG أو WEBP أو SVG.'));
      return;
    }

    if (logoFile.size > 2 * 1024 * 1024) {
      setLogoMessage(t('Logo is too large. Maximum size is 2 MB.', 'حجم الشعار كبير. الحد الأقصى 2MB.'));
      return;
    }

    const body = new FormData();
    body.set('brandId', text(form.id) || slugify(text(form.name_en) || 'brand'));
    body.set('file', logoFile);
    const response = await fetch('/api/admin/brand-logo', {method: 'POST', credentials: 'same-origin', body});
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      setLogoMessage(result?.message || t('Logo upload failed.', 'فشل رفع الشعار.'));
      return;
    }

    const nextForm: Row = {...form, logo_url: result.url};
    setForm(nextForm);
    setLogoFile(null);
    setLogoMessage(t('Logo uploaded.', 'تم رفع الشعار.'));

    if (text(nextForm.name_en) || text(nextForm.name_ar) || text(nextForm.id)) {
      await action(saveAction, nextForm);
    }
  }

  async function deleteLogo() {
    if (!logoUrl) return;
    const response = await fetch('/api/admin/brand-logo', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: logoUrl})
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      setLogoMessage(result?.message || t('Logo delete failed.', 'فشل حذف الشعار.'));
      return;
    }

    const nextForm: Row = {...form, logo_url: ''};
    setForm(nextForm);
    setLogoMessage(t('Logo deleted.', 'تم حذف الشعار.'));

    if (text(nextForm.name_en) || text(nextForm.name_ar) || text(nextForm.id)) {
      await action(saveAction, nextForm);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <div className={cls(cardClass(), 'grid content-start gap-3 p-4')}>
        <h3 className="text-xl font-black">{kind === 'category' ? t('Category', 'قسم') : t('Brand', 'ماركة')}</h3>
        <Field label={t('Arabic name', 'الاسم العربي')}><input className={inputClass()} value={form.name_ar ?? ''} onChange={(event) => setForm({...form, name_ar: event.target.value})} /></Field>
        <Field label={t('English name', 'الاسم الإنجليزي')}><input className={inputClass()} value={form.name_en ?? ''} onChange={(event) => setForm({...form, name_en: event.target.value, slug: form.slug || slugify(event.target.value)})} /></Field>
        <Field label={kind === 'category' ? t('Icon / image', 'أيقونة / صورة') : t('Logo', 'الشعار')}><input className={inputClass()} value={kind === 'category' ? form.icon ?? '' : form.logo_url ?? ''} onChange={(event) => setForm({...form, [kind === 'category' ? 'icon' : 'logo_url']: event.target.value})} /></Field>
        {kind === 'brand' ? (
          <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center gap-3">
              <FallbackImage alt="" className="h-16 w-16 rounded-md border border-zinc-200 bg-white object-contain p-2" src={localLogoPreview || logoUrl}>
                <div className="grid h-16 w-16 place-items-center rounded-md border border-zinc-200 bg-white text-xs font-black text-zinc-400">{t('No logo', 'لا شعار')}</div>
              </FallbackImage>
              <div className="min-w-0">
                <p className="text-sm font-black">{t('Brand logo', 'شعار الماركة')}</p>
                <p className="truncate text-xs font-bold text-zinc-500">{logoUrl || t('No logo uploaded', 'لم يتم رفع شعار')}</p>
              </div>
            </div>
            <input accept="image/jpeg,image/png,image/webp,image/svg+xml" className="text-sm font-bold text-zinc-700" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} type="file" />
            <div className="flex flex-wrap gap-2">
              <button className={buttonClass()} onClick={() => void uploadLogo()} type="button">{logoUrl ? t('Replace Logo', 'استبدال الشعار') : t('Upload Logo', 'رفع شعار')}</button>
              <button className={buttonClass('danger')} disabled={!logoUrl && !logoFile} onClick={() => { if (logoFile) { setLogoFile(null); setLogoMessage(t('Selected logo removed.', 'تمت إزالة الشعار المحدد.')); } else void deleteLogo(); }} type="button">{t('Delete Logo', 'حذف الشعار')}</button>
            </div>
            {logoMessage ? <p className="text-xs font-bold text-zinc-500">{logoMessage}</p> : null}
          </div>
        ) : null}
        {kind === 'brand' ? <Field label={t('Brand link / filter URL', 'رابط / فلتر الماركة')}><input className={inputClass()} dir="ltr" placeholder="/en?brand=Apple" value={form.homepage_url ?? ''} onChange={(event) => setForm({...form, homepage_url: event.target.value})} /></Field> : null}
        <Field label={t('Sort order', 'ترتيب العرض')}><input className={inputClass()} value={form.sort_order ?? ''} onChange={(event) => setForm({...form, sort_order: event.target.value})} /></Field>
        <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-3 text-sm font-black"><input checked={form.is_visible !== false} onChange={(event) => setForm({...form, is_visible: event.target.checked})} type="checkbox" />{t('Show in admin/store', 'إظهار')}</label>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass('primary')} disabled={busy} onClick={() => void action(saveAction, form)} type="button">{t('Save', 'حفظ')}</button>
          <button className={buttonClass()} onClick={() => setForm(empty)} type="button">{kind === 'brand' ? t('Add Brand', 'إضافة ماركة') : t('New', 'جديد')}</button>
        </div>
      </div>
      <div className="grid content-start gap-3">
        {rows.map((row) => (
          <article className={cls(cardClass(), 'grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center')} draggable={kind === 'brand'} key={row.id} onDragStart={() => setDraggedId(String(row.id))} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (kind !== 'brand' || !draggedId || draggedId === String(row.id)) return; const source = rows.find((item) => String(item.id) === draggedId); if (!source) return; const sourceOrder = Number(source.sort_order ?? 0); void action(saveAction, {...source, sort_order: Number(row.sort_order ?? 0)}); void action(saveAction, {...row, sort_order: sourceOrder}); setDraggedId(''); }}>
            <div className="flex min-w-0 items-center gap-3">{kind === 'brand' ? <FallbackImage alt={`${row.name_en || 'Brand'} logo`} className="h-14 w-14 shrink-0 rounded-md border border-zinc-200 bg-white object-contain p-2" src={text(row.logo_url)}><span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-xs font-black">{String(row.name_en || '?').slice(0, 2)}</span></FallbackImage> : null}<div className="min-w-0"><strong className="block truncate">{kind === 'brand' ? <span className="me-2 cursor-grab text-zinc-400">⋮⋮</span> : null}{labelFor(row)}</strong><p className="truncate text-sm font-bold text-zinc-500">{row.name_en || row.slug || row.id}</p>{kind === 'brand' ? <p className="mt-1 text-xs font-black"><span className={row.is_visible === false ? 'text-zinc-400' : 'text-emerald-600'}>{row.is_visible === false ? t('Hidden', 'مخفي') : t('Active', 'نشط')}</span><span className="mx-2 text-zinc-300">•</span><span className="text-zinc-500">{t('Order', 'الترتيب')}: {Number(row.sort_order ?? 0)}</span></p> : null}</div></div>
            <div className="flex flex-wrap gap-2"><button className={buttonClass()} onClick={() => setForm({...row, is_visible: row.is_visible !== false})} type="button">{t('Edit', 'تعديل')}</button><button className={buttonClass()} onClick={() => void action(saveAction, {...row, is_visible: false})} type="button">{t('Archive', 'أرشفة')}</button><button className={buttonClass('danger')} onClick={() => window.confirm(t('Delete this item?', 'حذف هذا العنصر؟')) && void action(deleteAction, {id: row.id})} type="button">{t('Delete', 'حذف')}</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsView({settings, busy, t, action}: {settings: Row; busy: boolean; t: (en: string, ar: string) => string; action: (action: string, payload: Row) => Promise<boolean>}) {
  const [form, setForm] = useState<Row>(settings);
  const [qrProgress, setQrProgress] = useState<number | null>(null);
  const [qrMessage, setQrMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => setForm(settings), [settings]);
  const fields = [
    ['logoUrl', t('Logo', 'الشعار')],
    ['faviconUrl', t('Favicon', 'أيقونة المتصفح')],
    ['bannerUrl', t('Banner', 'البنر')],
    ['whatsapp', t('WhatsApp numbers', 'أرقام واتساب')],
    ['instagram', 'Instagram'],
    ['deliveryOptions', t('Delivery fee', 'رسوم التوصيل')],
    ['siteUrl', t('Store information', 'معلومات المتجر')]
  ];

  function uploadQr(file: File) {
    setQrMessage('');
    setQrProgress(0);
    const body = new FormData();
    body.append('file', file);
    body.append('previousUrl', form.benefitPayQr ?? '');
    const request = new XMLHttpRequest();
    request.open('POST', '/api/admin/benefitpay-qr');
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setQrProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let result: Row | null = null;
      try {
        result = JSON.parse(request.responseText || 'null');
      } catch {
        result = null;
      }
      if (request.status < 200 || request.status >= 300 || !result?.ok) {
        setQrMessage(result?.message || t('QR upload failed.', 'فشل رفع رمز QR.'));
      } else {
        setForm((current) => ({...current, benefitPayQr: result.url}));
        setQrMessage(t('Upload complete. Save settings to persist it.', 'اكتمل الرفع. احفظ الإعدادات لتثبيته.'));
      }
      setQrProgress(null);
      if (fileInput.current) fileInput.current.value = '';
    };
    request.onerror = () => {
      setQrMessage(t('QR upload failed.', 'فشل رفع رمز QR.'));
      setQrProgress(null);
    };
    request.send(body);
  }

  async function removeQr() {
    if (!form.benefitPayQr || !window.confirm(t('Remove this BenefitPay QR?', 'هل تريد حذف رمز BenefitPay QR؟'))) return;
    setQrMessage(t('Removing QR...', 'جاري حذف رمز QR...'));
    const response = await fetch('/api/admin/benefitpay-qr', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: form.benefitPayQr})
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setQrMessage(result?.message || t('Could not remove QR.', 'تعذر حذف رمز QR.'));
      return;
    }
    const next = {...form, benefitPayQr: '', benefitPayEnabled: false};
    setForm(next);
    const saved = await action('saveSettings', next);
    setQrMessage(saved ? t('QR removed.', 'تم حذف رمز QR.') : t('QR removed from storage, but settings could not be saved.', 'تم حذف الصورة من التخزين، لكن تعذر حفظ الإعدادات.'));
  }

  return <section className={cls(cardClass(), 'grid gap-5 p-4')}>
    <h3 className="text-xl font-black">{t('Store Settings', 'إعدادات المتجر')}</h3>
    <div className="grid gap-3 md:grid-cols-2">{fields.map(([field, label]) => <Field label={label} key={field}><input className={inputClass()} value={form[field] ?? ''} onChange={(event) => setForm({...form, [field]: event.target.value})} /></Field>)}</div>
    <div className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <h4 className="text-lg font-black">BenefitPay</h4>
        <p className="text-sm font-bold text-zinc-500">{t('Manage the QR shown in the existing order flow.', 'إدارة رمز QR الظاهر في مسار الطلب الحالي.')}</p>
      </div>
      {(!form.benefitPayEnabled || !form.benefitPayQr || !form.benefitPayInstructionsAr || !form.benefitPayInstructionsEn) ? <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900">
        {t('BenefitPay checkout is incomplete. Missing:', 'إعداد BenefitPay غير مكتمل. الحقول الناقصة:')} {' '}
        {[
          !form.benefitPayEnabled ? 'benefitpay_enabled' : '',
          !form.benefitPayQr ? 'benefitpay_qr_url' : '',
          !form.benefitPayInstructionsAr ? 'benefitpay_instructions_ar' : '',
          !form.benefitPayInstructionsEn ? 'benefitpay_instructions_en' : ''
        ].filter(Boolean).join(', ')}
      </div> : null}
      <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white p-3 text-sm font-black">
        <span>{t('BenefitPay enabled', 'تفعيل BenefitPay')}</span>
        <input checked={form.benefitPayEnabled === true} disabled={!form.benefitPayQr} onChange={(event) => setForm({...form, benefitPayEnabled: event.target.checked})} type="checkbox" />
      </label>
      <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-center">
        <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {form.benefitPayQr ? <img alt="BenefitPay QR preview" className="h-full w-full object-contain p-2" src={form.benefitPayQr} /> : <span className="p-4 text-center text-sm font-bold text-zinc-400">{t('No QR uploaded', 'لم يتم رفع رمز QR')}</span>}
        </div>
        <div className="grid gap-3">
          <input ref={fileInput} className="hidden" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(event) => {const file = event.target.files?.[0]; if (file) uploadQr(file);}} type="file" />
          <div className="flex flex-wrap gap-2">
            <button className={buttonClass()} disabled={qrProgress !== null} onClick={() => fileInput.current?.click()} type="button">{form.benefitPayQr ? t('Replace image', 'استبدال الصورة') : t('Upload image', 'رفع صورة')}</button>
            {form.benefitPayQr ? <button className={buttonClass('danger')} disabled={busy || qrProgress !== null} onClick={() => void removeQr()} type="button">{t('Remove image', 'حذف الصورة')}</button> : null}
          </div>
          <p className="text-xs font-bold text-zinc-500">PNG, JPG, JPEG, WebP · {t('Maximum 5 MB', 'الحد الأقصى 5 ميجابايت')}</p>
          {qrProgress !== null ? <div className="grid gap-1"><div className="h-2 overflow-hidden rounded-full bg-zinc-200"><div className="h-full bg-zinc-950 transition-all" style={{width: `${qrProgress}%`}} /></div><span className="text-xs font-black">{qrProgress}%</span></div> : null}
          {qrMessage ? <p className="text-sm font-bold text-zinc-700">{qrMessage}</p> : null}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t('Account holder name', 'اسم صاحب الحساب')}><input className={inputClass()} value={form.benefitPayAccountHolder ?? ''} onChange={(event) => setForm({...form, benefitPayAccountHolder: event.target.value})} /></Field>
        <Field label={t('BenefitPay phone number', 'رقم هاتف BenefitPay')}><input className={inputClass()} inputMode="tel" value={form.benefitPayPhone ?? ''} onChange={(event) => setForm({...form, benefitPayPhone: event.target.value})} /></Field>
        <Field label={t('IBAN or payment reference', 'IBAN أو مرجع الدفع')}><input className={inputClass()} value={form.iban ?? ''} onChange={(event) => setForm({...form, iban: event.target.value})} /></Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t('Arabic payment instructions', 'تعليمات الدفع بالعربية')}><textarea className={areaClass()} dir="rtl" value={form.benefitPayInstructionsAr ?? ''} onChange={(event) => setForm({...form, benefitPayInstructionsAr: event.target.value})} /></Field>
        <Field label={t('English payment instructions', 'تعليمات الدفع بالإنجليزية')}><textarea className={areaClass()} dir="ltr" value={form.benefitPayInstructionsEn ?? ''} onChange={(event) => setForm({...form, benefitPayInstructionsEn: event.target.value})} /></Field>
      </div>
    </div>
    <button className={buttonClass('primary')} disabled={busy || qrProgress !== null} onClick={() => void action('saveSettings', form)} type="button">{t('Save settings', 'حفظ الإعدادات')}</button>
  </section>;
}

function LeadsView({rows, t, action}: {rows: Row[]; t: (en: string, ar: string) => string; action: (action: string, payload: Row) => Promise<boolean>}) {
  return <section className="grid gap-3">{rows.map((row) => <article className={cls(cardClass(), 'grid gap-3 p-4 md:grid-cols-[1fr_auto]')} key={row.id}><div className="min-w-0"><strong>{row.customer_name || t('Product inquiry', 'استفسار منتج')}</strong><p className="text-sm font-bold text-zinc-500">{row.customer_phone || row.action || '-'}</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-500">{JSON.stringify(row.metadata ?? row, null, 2)}</pre></div><button className={buttonClass('danger')} onClick={() => void action('deleteLead', {id: row.id})} type="button">{t('Delete', 'حذف')}</button></article>)}</section>;
}

function UsersView({rows, busy, t, action}: {rows: Row[]; busy: boolean; t: (en: string, ar: string) => string; action: (action: string, payload: Row) => Promise<boolean>}) {
  const [form, setForm] = useState<Row>({id: '', name: '', email: '', role: 'employee', is_active: true});
  return <section className="grid gap-5 xl:grid-cols-[420px_1fr]"><div className={cls(cardClass(), 'grid content-start gap-3 p-4')}><h3 className="text-xl font-black">{t('Users & Roles', 'المستخدمون والصلاحيات')}</h3><Field label={t('Name', 'الاسم')}><input className={inputClass()} value={form.name ?? ''} onChange={(event) => setForm({...form, name: event.target.value})} /></Field><Field label={t('Email', 'البريد')}><input className={inputClass()} value={form.email ?? ''} onChange={(event) => setForm({...form, email: event.target.value})} /></Field><Field label={t('Role', 'الصلاحية')}><select className={inputClass()} value={form.role ?? 'employee'} onChange={(event) => setForm({...form, role: event.target.value})}><option value="owner">{t('Owner', 'المالك')}</option><option value="employee">{t('Employee', 'موظف')}</option></select></Field><button className={buttonClass('primary')} disabled={busy} onClick={() => void action('saveEmployee', form)} type="button">{t('Save user', 'حفظ المستخدم')}</button></div><ListRows rows={rows} t={t} onEdit={setForm} onDelete={(row) => action('deleteEmployee', {id: row.id})} /></section>;
}

function MediaView({products, t}: {products: Row[]; t: (en: string, ar: string) => string}) {
  const images = products.flatMap((product) => imagesOf(product).map((url) => ({url, product})));
  return <section className={cls(cardClass(), 'p-4')}><h3 className="text-xl font-black">{t('Media Library', 'مكتبة الوسائط')}</h3><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">{images.map(({url, product}, index) => <a className="overflow-hidden rounded-lg border border-zinc-200" href={url} key={`${url}-${index}`} target="_blank"><FallbackImage alt={product.name_en || ''} className="aspect-square w-full object-cover" src={url}><div className="grid aspect-square place-items-center bg-zinc-100 p-2 text-center text-xs font-bold text-zinc-400">{t('Image unavailable', 'الصورة لا تظهر')}</div></FallbackImage></a>)}</div></section>;
}

function ActivityView({products, t}: {products: Row[]; t: (en: string, ar: string) => string}) {
  return <section className={cls(cardClass(), 'p-4')}><h3 className="text-xl font-black">{t('Activity Log', 'سجل النشاط')}</h3><div className="mt-4 grid gap-3">{products.slice(0, 20).map((product) => <article className="rounded-md border border-zinc-200 p-3" key={product.id}><strong className="text-sm">{product.name_en || product.name_ar}</strong><p className="text-xs font-bold text-zinc-500">{t('Product updated', 'تم تحديث المنتج')} · {product.updated_at || product.created_at || '-'}</p></article>)}</div></section>;
}

function ListRows({rows, t, onEdit, onDelete}: {rows: Row[]; t: (en: string, ar: string) => string; onEdit: (row: Row) => void; onDelete: (row: Row) => Promise<boolean>}) {
  return <div className="grid content-start gap-3">{rows.map((row) => <article className={cls(cardClass(), 'grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center')} key={row.id}><div className="min-w-0"><strong className="block truncate">{labelFor(row)}</strong><p className="truncate text-sm font-bold text-zinc-500">{row.title_en || row.name_en || row.email || row.source || row.id}</p></div><div className="flex flex-wrap gap-2"><button className={buttonClass()} onClick={() => onEdit(row)} type="button">{t('Edit', 'تعديل')}</button><button className={buttonClass('danger')} onClick={() => window.confirm(t('Delete this row?', 'حذف هذا السجل؟')) && void onDelete(row)} type="button">{t('Delete', 'حذف')}</button></div></article>)}</div>;
}

function Panel({title, children}: {title: string; children: ReactNode}) {
  return <section className="grid gap-3"><h4 className="text-lg font-black">{title}</h4><div className="grid gap-3">{children}</div></section>;
}

function Field({label, required, children}: {label: string; required?: boolean; children: ReactNode}) {
  return <label className="min-w-0"><span className="mb-1 block text-xs font-black uppercase text-zinc-500">{label}{required ? ' *' : ''}</span>{children}</label>;
}
