'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Locale} from '@/lib/types';
import {AdminShell} from './AdminShell';
import {FallbackImage} from './FallbackImage';

type Row = Record<string, any>;
type Section = 'basic' | 'details' | 'pricing' | 'inventory' | 'variants' | 'images' | 'organization' | 'seo';

const emptyProduct: Row = {
  id: '',
  name_ar: '',
  name_en: '',
  short_description_ar: '',
  short_description_en: '',
  description_ar: '',
  description_en: '',
  features: '',
  details_specifications: '',
  box_contents: '',
  warranty_details: '',
  additional_notes: '',
  price_bhd: '',
  old_price_bhd: '',
  cost_price_bhd: '',
  currency: 'BHD',
  sku: '',
  internal_code: '',
  quantity: '',
  low_stock_alert: '0',
  stock_status: 'available',
  publication_status: 'published',
  brand_id: '',
  category_id: '',
  tags: '',
  is_featured: false,
  is_new: false,
  is_offer: false,
  is_trending: false,
  condition: 'New',
  warranty: '1 year',
  installments: 'Available',
  storage: '',
  ram: '',
  colors: '',
  specifications_en: '',
  specifications_ar: '',
  variants: [],
  slug: '',
  meta_title: '',
  meta_description: '',
  sort_order: '0',
  image_urls: ''
};

const ramOptions = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB'];
const storageOptions = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

const sectionOrder: Section[] = ['basic', 'details', 'pricing', 'inventory', 'variants', 'images', 'organization', 'seo'];

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function inputClass() {
  return 'h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm font-bold text-white outline-none transition focus:border-brand-neon';
}

function areaClass(rows = 4) {
  return cls(inputClass(), rows > 4 ? 'min-h-40 py-3' : 'min-h-28 py-3');
}

function buttonClass(tone: 'primary' | 'quiet' | 'danger' = 'quiet') {
  if (tone === 'primary') return 'h-10 rounded-md bg-brand-neon px-4 text-sm font-black text-white disabled:opacity-50';
  if (tone === 'danger') return 'h-10 rounded-md bg-red-500/15 px-4 text-sm font-black text-red-200 disabled:opacity-50';
  return 'h-10 rounded-md border border-white/10 bg-black px-4 text-sm font-black text-zinc-200 disabled:opacity-50';
}

function lines(value: unknown) {
  return Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : '';
}

function list(value: unknown) {
  return lines(value).split('\n').map((item) => item.trim()).filter(Boolean);
}

function joinList(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean).join('\n');
}

function data(product: Row) {
  return product.data && typeof product.data === 'object' ? product.data : {};
}

function priceValue(product: Row) {
  return product.price_bhd ?? product.price ?? '';
}

function productStatus(product: Row) {
  const productData = data(product);
  if (product.status === 'deleted' || product.stock_status === 'deleted') return 'archived';
  return productData.publication_status ?? product.status ?? (product.is_active === false ? 'draft' : 'published');
}

function productImages(product: Row) {
  const rows = Array.isArray(product.product_images)
    ? [...product.product_images].sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    : [];
  const urls = Array.isArray(product.image_urls) ? product.image_urls : list(product.image_urls);
  return {
    rows,
    urls: [...rows.map((image) => image.url), ...urls].map((url) => String(url).trim()).filter(Boolean)
  };
}

function badgeText(product: Row) {
  const productData = data(product);
  return [
    product.is_featured || productData.is_featured ? 'Featured' : '',
    product.is_new || productData.is_new ? 'New' : '',
    product.is_offer || productData.is_offer ? 'Offer' : '',
    productData.is_trending ? 'Trending' : ''
  ].filter(Boolean);
}

function hydrateForm(product: Row): Row {
  const productData = data(product);
  const images = productImages(product).urls;
  return {
    ...emptyProduct,
    id: product.id,
    name_ar: product.name_ar ?? '',
    name_en: product.name_en ?? '',
    short_description_ar: productData.short_description_ar ?? product.short_description_ar ?? '',
    short_description_en: productData.short_description_en ?? product.short_description_en ?? '',
    description_ar: product.description_ar ?? '',
    description_en: product.description_en ?? '',
    features: lines(productData.features ?? product.features),
    details_specifications: lines(productData.details_specifications ?? product.details_specifications),
    box_contents: lines(productData.box_contents ?? product.box_contents),
    warranty_details: productData.warranty_details ?? product.warranty_details ?? '',
    additional_notes: productData.additional_notes ?? product.additional_notes ?? '',
    price_bhd: priceValue(product),
    old_price_bhd: product.old_price_bhd ?? product.old_price ?? '',
    cost_price_bhd: productData.cost_price_bhd ?? '',
    currency: productData.currency ?? 'BHD',
    sku: productData.sku ?? '',
    internal_code: productData.internal_code ?? '',
    quantity: productData.quantity ?? '',
    low_stock_alert: productData.low_stock_alert ?? 0,
    stock_status: product.stock_status ?? 'available',
    publication_status: productStatus(product),
    brand_id: product.brand_id ?? '',
    category_id: product.category_id ?? '',
    tags: lines(productData.tags ?? product.tags),
    is_featured: Boolean(product.is_featured || productData.is_featured),
    is_new: Boolean(product.is_new || productData.is_new),
    is_offer: Boolean(product.is_offer || productData.is_offer),
    is_trending: Boolean(productData.is_trending),
    condition: product.condition ?? 'New',
    warranty: product.warranty ?? '1 year',
    installments: product.installments ?? 'Available',
    storage: lines(product.storage).trim() || lines(productData.storage),
    ram: productData.ram ?? '',
    colors: lines(product.colors),
    specifications_en: lines(product.specifications_en ?? product.specs_en),
    specifications_ar: lines(product.specifications_ar ?? product.specs_ar),
    variants: Array.isArray(productData.variants) ? productData.variants : [],
    slug: productData.slug ?? '',
    slug_history: productData.slug_history ?? [],
    meta_title: productData.meta_title ?? '',
    meta_description: productData.meta_description ?? '',
    sort_order: product.sort_order ?? 0,
    image_urls: lines(images)
  };
}

function makePayload(form: Row) {
  const oldSlug = Array.isArray(form.slug_history) ? form.slug_history : [];
  return {
    ...form,
    slug_history: form.slug ? Array.from(new Set([...oldSlug, form.slug])) : oldSlug,
    variants: Array.isArray(form.variants) ? form.variants : []
  };
}

function formatDate(value: unknown, locale: Locale) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-BH' : 'en-BH', {dateStyle: 'medium', timeStyle: 'short'}).format(date);
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
  const datalistId = useMemo(() => `admin-product-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2)}`, [label]);

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
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white"
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

export function AdminProductsManager({locale}: {locale: Locale}) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [products, setProducts] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [brands, setBrands] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>(emptyProduct);
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState(t('Loading products from Supabase...', 'جاري تحميل المنتجات من Supabase...'));
  const [notice, setNotice] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [dragImageId, setDragImageId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const perPage = 8;

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const productImageRows = useMemo(() => {
    const product = products.find((item) => Number(item.id) === Number(form.id));
    return product ? productImages(product).rows : [];
  }, [form.id, products]);

  const currentImages = useMemo(() => list(form.image_urls), [form.image_urls]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filteredRows = products.filter((product) => {
      const productData = data(product);
      const matchesQuery = !needle || [
        product.name_ar,
        product.name_en,
        product.id,
        productData.sku,
        productData.internal_code
      ].join(' ').toLowerCase().includes(needle);
      const matchesBrand = brandFilter === 'all' || String(product.brand_id) === brandFilter;
      const matchesCategory = categoryFilter === 'all' || String(product.category_id) === categoryFilter;
      const matchesAvailability = availabilityFilter === 'all' || String(product.stock_status) === availabilityFilter;
      const matchesStatus = statusFilter === 'all' || productStatus(product) === statusFilter;
      return matchesQuery && matchesBrand && matchesCategory && matchesAvailability && matchesStatus;
    });

    return filteredRows.sort((a, b) => {
      if (sort === 'oldest') return Date.parse(a.created_at ?? '') - Date.parse(b.created_at ?? '');
      if (sort === 'price') return Number(priceValue(a) || 0) - Number(priceValue(b) || 0);
      if (sort === 'name') return String(a.name_en || a.name_ar).localeCompare(String(b.name_en || b.name_ar));
      return Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '');
    });
  }, [availabilityFilter, brandFilter, categoryFilter, products, query, sort, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageProducts = filtered.slice((page - 1) * perPage, page * perPage);

  async function load() {
    const response = await fetch('/api/admin/product-manager', {cache: 'no-store', credentials: 'same-origin'});
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setStatus(result?.message || t('Could not load products.', 'تعذر تحميل المنتجات.'));
      return null;
    }
    setProducts(result.data.products ?? []);
    setCategories(result.data.categories ?? []);
    setBrands(result.data.brands ?? []);
    setStatus(t('Products loaded.', 'تم تحميل المنتجات.'));
    return result.data;
  }

  async function action(actionName: string, payload: Row = {}) {
    setIsSaving(true);
    setStatus(t('Working...', 'جاري التنفيذ...'));
    try {
      const response = await fetch('/api/admin/product-manager', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: actionName, payload})
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setStatus(result?.message || t('Action failed.', 'فشلت العملية.'));
        return null;
      }
      setProducts(result.data.products ?? []);
      setCategories(result.data.categories ?? []);
      setBrands(result.data.brands ?? []);
      setNotice(t('Saved successfully.', 'تم الحفظ بنجاح.'));
      setStatus(t('Synced with Supabase.', 'تمت المزامنة مع Supabase.'));
      if (result.data.savedProductId) {
        const saved = (result.data.products ?? []).find((product: Row) => Number(product.id) === Number(result.data.savedProductId));
        if (saved) openProduct(saved, false);
      }
      setDirty(false);
      return result.data;
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: string, value: unknown) {
    setForm((current) => ({...current, [field]: value}));
    setDirty(true);
  }

  function openProduct(product: Row, scroll = true) {
    setForm(hydrateForm(product));
    setActiveSection('basic');
    setDirty(false);
    if (scroll) window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function newProduct() {
    if (dirty && !window.confirm(t('Discard unsaved changes?', 'هل تريد تجاهل التغييرات غير المحفوظة؟'))) return;
    setForm(emptyProduct);
    setActiveSection('basic');
    setDirty(false);
  }

  async function saveProduct() {
    if (!String(form.name_ar || form.name_en).trim()) {
      setStatus(t('Product name is required.', 'اسم المنتج مطلوب.'));
      setActiveSection('basic');
      return;
    }
    if (!Number.isFinite(Number(form.price_bhd)) || Number(form.price_bhd) <= 0) {
      setStatus(t('Selling price must be greater than zero.', 'سعر البيع يجب أن يكون أكبر من صفر.'));
      setActiveSection('pricing');
      return;
    }
    await action('saveProduct', makePayload(form));
  }

  async function uploadImages() {
    if (!form.id || !files?.length) {
      setStatus(t('Save the product first, then choose images.', 'احفظ المنتج أولًا ثم اختر الصور.'));
      return;
    }
    const body = new FormData();
    body.set('productId', String(form.id));
    Array.from(files).forEach((file) => body.append('files', file));
    const response = await fetch('/api/admin/console/images', {method: 'POST', credentials: 'same-origin', body});
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setStatus(result?.message || t('Image upload failed.', 'فشل رفع الصور.'));
      return;
    }
    setFiles(null);
    const data = await load();
    const saved = (data?.products ?? []).find((product: Row) => Number(product.id) === Number(form.id));
    if (saved) openProduct(saved, false);
    setNotice(t('Images uploaded.', 'تم رفع الصور.'));
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
      setStatus(result?.message || t('Image delete failed.', 'فشل حذف الصورة.'));
      return;
    }
    const data = await load();
    const saved = (data?.products ?? []).find((product: Row) => Number(product.id) === Number(form.id));
    if (saved) openProduct(saved, false);
  }

  async function reorderImages(targetImageId: number) {
    if (!dragImageId || dragImageId === targetImageId) return;
    const ids = productImageRows.map((image) => Number(image.id));
    const from = ids.indexOf(dragImageId);
    const to = ids.indexOf(targetImageId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await action('reorderImages', {id: form.id, imageIds: ids});
    setDragImageId(null);
  }

  async function addExternalImage() {
    if (!form.id || !externalUrl.trim()) return;
    const data = await action('addExternalImage', {id: form.id, url: externalUrl.trim()});
    setExternalUrl('');
    const saved = (data?.products ?? []).find((product: Row) => Number(product.id) === Number(form.id));
    if (saved) openProduct(saved, false);
  }

  function updateVariant(index: number, field: string, value: unknown) {
    const variants = [...(Array.isArray(form.variants) ? form.variants : [])];
    variants[index] = {...variants[index], [field]: value};
    updateField('variants', variants);
  }

  function addVariant() {
    updateField('variants', [...(Array.isArray(form.variants) ? form.variants : []), {color: '', storage: '', ram: '', warranty: '', price_bhd: '', stock: 0, sku: ''}]);
  }

  const labels: Record<Section, string> = {
    basic: t('Basic', 'الأساسيات'),
    details: t('Details', 'التفاصيل'),
    pricing: t('Pricing', 'التسعير'),
    inventory: t('Inventory', 'المخزون'),
    variants: t('Variants', 'المتغيرات'),
    images: t('Images', 'الصور'),
    organization: t('Organization', 'التنظيم'),
    seo: 'SEO'
  };

  return (
    <AdminShell
      actions={(
        <>
          <button className={buttonClass()} onClick={() => void load()} type="button">{t('Refresh', 'تحديث')}</button>
          <button className={buttonClass('primary')} disabled={isSaving} onClick={() => void saveProduct()} type="button">{isSaving ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}</button>
          <a className={buttonClass()} href={`/${locale}`} target="_blank">{t('Storefront', 'الموقع')}</a>
        </>
      )}
      locale={locale}
      subtitle={t('A premium Supabase-powered workspace for catalog operations.', 'مساحة عمل احترافية مرتبطة بـ Supabase لإدارة الكتالوج.')}
      title={t('Product Management', 'إدارة المنتجات')}
    >

        {notice ? <p className="rounded-md border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-black text-emerald-200">{notice}</p> : null}
        <p className="rounded-md border border-white/10 bg-zinc-950 p-3 text-sm font-bold text-zinc-300">{status}</p>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.95fr)]">
          <div className="grid content-start gap-4">
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px_150px_130px]">
                <input className={inputClass()} onChange={(event) => {setQuery(event.target.value); setPage(1);}} placeholder={t('Search name or SKU...', 'ابحث بالاسم أو SKU...')} value={query} />
                <select className={inputClass()} onChange={(event) => setBrandFilter(event.target.value)} value={brandFilter}>
                  <option value="all">{t('All brands', 'كل الماركات')}</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name_en}</option>)}
                </select>
                <select className={inputClass()} onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
                  <option value="all">{t('All categories', 'كل الأقسام')}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}
                </select>
                <select className={inputClass()} onChange={(event) => setAvailabilityFilter(event.target.value)} value={availabilityFilter}>
                  <option value="all">{t('Availability', 'التوفر')}</option>
                  <option value="available">{t('Available', 'متوفر')}</option>
                  <option value="out-of-stock">{t('Out of stock', 'غير متوفر')}</option>
                  <option value="hidden">{t('Hidden', 'مخفي')}</option>
                </select>
                <select className={inputClass()} onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                  <option value="all">{t('Status', 'الحالة')}</option>
                  <option value="published">{t('Published', 'منشور')}</option>
                  <option value="draft">{t('Draft', 'مسودة')}</option>
                  <option value="archived">{t('Archived', 'مؤرشف')}</option>
                </select>
                <select className={inputClass()} onChange={(event) => setSort(event.target.value)} value={sort}>
                  <option value="newest">{t('Newest', 'الأحدث')}</option>
                  <option value="oldest">{t('Oldest', 'الأقدم')}</option>
                  <option value="price">{t('Price', 'السعر')}</option>
                  <option value="name">{t('Name', 'الاسم')}</option>
                </select>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-zinc-400">{t(`${filtered.length} products`, `${filtered.length} منتج`)}</p>
                <div className="flex flex-wrap gap-2">
                  <button className={buttonClass()} disabled={!selected.length} onClick={() => void action('bulkArchive', {ids: selected})} type="button">{t('Archive selected', 'إخفاء المحدد')}</button>
                  <button className={buttonClass()} disabled={!selected.length} onClick={() => void action('bulkRestore', {ids: selected})} type="button">{t('Restore selected', 'استرجاع المحدد')}</button>
                  <button className={buttonClass('danger')} disabled={!selected.length} onClick={() => window.confirm(t('Delete selected products permanently?', 'حذف المنتجات المحددة نهائيًا؟')) && void action('bulkDelete', {ids: selected})} type="button">{t('Delete selected', 'حذف المحدد')}</button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
              <div className="hidden grid-cols-[42px_72px_minmax(180px,1.5fr)_110px_110px_100px_100px_120px_150px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase text-zinc-500 lg:grid">
                <span />
                <span>{t('Image', 'الصورة')}</span>
                <span>{t('Product', 'المنتج')}</span>
                <span>SKU</span>
                <span>{t('Brand', 'الماركة')}</span>
                <span>{t('Price', 'السعر')}</span>
                <span>{t('Stock', 'التوفر')}</span>
                <span>{t('Status', 'الحالة')}</span>
                <span>{t('Actions', 'إجراءات')}</span>
              </div>
              {pageProducts.map((product) => {
                const productData = data(product);
                const images = productImages(product).urls;
                const id = Number(product.id);
                const checked = selected.includes(id);
                return (
                  <article className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 lg:grid-cols-[42px_72px_minmax(180px,1.5fr)_110px_110px_100px_100px_120px_150px] lg:items-center" key={product.id}>
                    <input checked={checked} className="h-5 w-5 accent-brand-neon" onChange={() => setSelected((items) => checked ? items.filter((item) => item !== id) : [...items, id])} type="checkbox" />
                    <FallbackImage alt={product.name_en || product.name_ar || ''} className="h-16 w-16 rounded-md object-cover" src={images[0]}>
                      <div className="grid h-16 w-16 place-items-center rounded-md bg-black text-xs font-bold text-zinc-500">{t('No image', 'لا صورة')}</div>
                    </FallbackImage>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm">{product.name_ar || '-'}</strong>
                      <span className="block truncate text-xs font-bold text-zinc-400">{product.name_en || '-'}</span>
                      <span className="mt-1 block text-xs font-bold text-zinc-500">{formatDate(product.updated_at ?? product.created_at, locale)}</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {badgeText(product).map((badge) => <span className="rounded-full border border-brand-neon/30 px-2 py-1 text-[10px] font-black text-brand-neon" key={badge}>{badge}</span>)}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-zinc-300">{productData.sku || '-'}</span>
                    <span className="text-sm font-bold text-zinc-300">{product.brand || brands.find((brand) => Number(brand.id) === Number(product.brand_id))?.name_en || '-'}</span>
                    <span className="text-sm font-black text-brand-neon">BHD {priceValue(product) || '-'}</span>
                    <span className="text-sm font-bold text-zinc-300">{product.stock_status || '-'}</span>
                    <span className="text-sm font-bold text-zinc-300">{productStatus(product)}</span>
                    <div className="flex flex-wrap gap-2">
                      <button className={buttonClass()} onClick={() => openProduct(product)} type="button">{t('Edit', 'تعديل')}</button>
                      <a className={buttonClass()} href={`/${locale}/product/${product.id}`} target="_blank">{t('View', 'عرض')}</a>
                      <button className={buttonClass()} onClick={() => void action('duplicateProduct', {id})} type="button">{t('Duplicate', 'نسخ')}</button>
                      {productStatus(product) === 'archived'
                        ? <button className={buttonClass()} onClick={() => void action('restoreProduct', {id})} type="button">{t('Restore', 'استرجاع')}</button>
                        : <button className={buttonClass()} onClick={() => void action('archiveProduct', {id})} type="button">{t('Archive', 'أرشفة')}</button>}
                      <button className={buttonClass()} onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/${locale}/product/${product.id}`)} type="button">{t('Share', 'نسخ الرابط')}</button>
                      <button className={buttonClass('danger')} onClick={() => window.confirm(t('Delete permanently?', 'حذف نهائي؟')) && void action('deleteProduct', {id})} type="button">{t('Delete', 'حذف')}</button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button className={buttonClass()} disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">{t('Previous', 'السابق')}</button>
              <span className="text-sm font-black text-zinc-400">{page} / {pages}</span>
              <button className={buttonClass()} disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} type="button">{t('Next', 'التالي')}</button>
            </div>
          </div>

          <aside className="grid content-start gap-4 rounded-lg border border-white/10 bg-zinc-950 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase text-zinc-500">{form.id ? `#${form.id}` : t('New product', 'منتج جديد')}</p>
                <h2 className="text-xl font-black">{form.name_ar || form.name_en || t('Untitled product', 'منتج بدون اسم')}</h2>
              </div>
              <button className={buttonClass()} onClick={newProduct} type="button">{t('New', 'جديد')}</button>
            </div>

            <div className="hide-scrollbar flex gap-2 overflow-x-auto">
              {sectionOrder.map((section) => (
                <button className={cls('h-10 shrink-0 rounded-md px-3 text-sm font-black', activeSection === section ? 'bg-brand-neon text-white' : 'border border-white/10 bg-black text-zinc-300')} key={section} onClick={() => setActiveSection(section)} type="button">
                  {labels[section]}
                </button>
              ))}
            </div>

            {activeSection === 'basic' ? (
              <Panel title={labels.basic}>
                <Field label={t('Arabic Name', 'الاسم بالعربي')} required><input className={inputClass()} value={form.name_ar ?? ''} onChange={(event) => updateField('name_ar', event.target.value)} /></Field>
                <Field label={t('English Name', 'الاسم بالإنجليزي')} required><input className={inputClass()} value={form.name_en ?? ''} onChange={(event) => updateField('name_en', event.target.value)} /></Field>
                <Field label={t('Short Description AR', 'وصف مختصر عربي')}><textarea className={areaClass()} value={form.short_description_ar ?? ''} onChange={(event) => updateField('short_description_ar', event.target.value)} /></Field>
                <Field label={t('Short Description EN', 'وصف مختصر إنجليزي')}><textarea className={areaClass()} value={form.short_description_en ?? ''} onChange={(event) => updateField('short_description_en', event.target.value)} /></Field>
                <Field label={t('Full Description AR', 'الوصف الكامل عربي')}><textarea className={areaClass(7)} value={form.description_ar ?? ''} onChange={(event) => updateField('description_ar', event.target.value)} /></Field>
                <Field label={t('Full Description EN', 'الوصف الكامل إنجليزي')}><textarea className={areaClass(7)} value={form.description_en ?? ''} onChange={(event) => updateField('description_en', event.target.value)} /></Field>
              </Panel>
            ) : null}

            {activeSection === 'details' ? (
              <Panel title={labels.details}>
                {[
                  ['features', t('Features', 'المميزات')],
                  ['details_specifications', t('Specifications', 'المواصفات')],
                  ['box_contents', t('Box Contents', 'محتويات العلبة')],
                  ['warranty_details', t('Warranty Details', 'تفاصيل الضمان')],
                  ['additional_notes', t('Additional Notes', 'ملاحظات إضافية')]
                ].map(([field, label]) => (
                  <Field label={label} key={field}><textarea className={areaClass()} value={form[field] ?? ''} onChange={(event) => updateField(field, event.target.value)} /></Field>
                ))}
                <Field label="Storage"><CreatableSelect label="Storage" options={storageOptions} placeholder="128GB" value={form.storage ?? ''} onChange={(value) => updateField('storage', value)} /></Field>
                <Field label="RAM"><CreatableSelect label="RAM" options={ramOptions} placeholder="8GB" value={form.ram ?? ''} onChange={(value) => updateField('ram', value)} /></Field>
              </Panel>
            ) : null}

            {activeSection === 'pricing' ? (
              <Panel title={labels.pricing}>
                <Field label={t('Selling Price', 'سعر البيع')} required><input className={inputClass()} inputMode="decimal" value={form.price_bhd ?? ''} onChange={(event) => updateField('price_bhd', event.target.value)} /></Field>
                <Field label={t('Old Price', 'السعر القديم')}><input className={inputClass()} inputMode="decimal" value={form.old_price_bhd ?? ''} onChange={(event) => updateField('old_price_bhd', event.target.value)} /></Field>
                <Field label={t('Cost Price', 'سعر التكلفة')}><input className={inputClass()} inputMode="decimal" value={form.cost_price_bhd ?? ''} onChange={(event) => updateField('cost_price_bhd', event.target.value)} /></Field>
                <Field label={t('Currency', 'العملة')}><input className={inputClass()} value={form.currency ?? 'BHD'} onChange={(event) => updateField('currency', event.target.value)} /></Field>
              </Panel>
            ) : null}

            {activeSection === 'inventory' ? (
              <Panel title={labels.inventory}>
                <Field label="SKU"><input className={inputClass()} value={form.sku ?? ''} onChange={(event) => updateField('sku', event.target.value)} /></Field>
                <Field label={t('Internal Code', 'الكود الداخلي')}><input className={inputClass()} value={form.internal_code ?? ''} onChange={(event) => updateField('internal_code', event.target.value)} /></Field>
                <Field label={t('Quantity', 'الكمية')}><input className={inputClass()} inputMode="numeric" value={form.quantity ?? ''} onChange={(event) => updateField('quantity', event.target.value)} /></Field>
                <Field label={t('Low Stock Alert', 'تنبيه انخفاض المخزون')}><input className={inputClass()} inputMode="numeric" value={form.low_stock_alert ?? ''} onChange={(event) => updateField('low_stock_alert', event.target.value)} /></Field>
                <Field label={t('Availability', 'التوفر')}>
                  <select className={inputClass()} value={form.stock_status ?? 'available'} onChange={(event) => updateField('stock_status', event.target.value)}>
                    <option value="available">{t('Available', 'متوفر')}</option>
                    <option value="out-of-stock">{t('Out of stock', 'غير متوفر')}</option>
                    <option value="hidden">{t('Hidden', 'مخفي')}</option>
                  </select>
                </Field>
              </Panel>
            ) : null}

            {activeSection === 'variants' ? (
              <Panel title={labels.variants}>
                {(Array.isArray(form.variants) ? form.variants : []).map((variant: Row, index: number) => (
                  <div className="grid gap-2 rounded-md border border-white/10 bg-black p-3" key={index}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {['color', 'warranty', 'price_bhd', 'stock', 'sku'].map((field) => (
                        <input className={inputClass()} key={field} placeholder={field} value={variant[field] ?? ''} onChange={(event) => updateVariant(index, field, event.target.value)} />
                      ))}
                      <CreatableSelect label={`variant-storage-${index}`} options={storageOptions} placeholder="storage" value={variant.storage ?? ''} onChange={(value) => updateVariant(index, 'storage', value)} />
                      <CreatableSelect label={`variant-ram-${index}`} options={ramOptions} placeholder="ram" value={variant.ram ?? ''} onChange={(value) => updateVariant(index, 'ram', value)} />
                    </div>
                    <button className={buttonClass('danger')} onClick={() => updateField('variants', form.variants.filter((_: Row, itemIndex: number) => itemIndex !== index))} type="button">{t('Remove variant', 'حذف المتغير')}</button>
                  </div>
                ))}
                <button className={buttonClass()} onClick={addVariant} type="button">{t('Add variant', 'إضافة متغير')}</button>
              </Panel>
            ) : null}

            {activeSection === 'images' ? (
              <Panel title={labels.images}>
                <div className="rounded-lg border border-dashed border-white/20 bg-black p-5 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {event.preventDefault(); setFiles(event.dataTransfer.files);}}>
                  <p className="text-sm font-black">{t('Drag images here or choose files', 'اسحب الصور هنا أو اختر الملفات')}</p>
                  <input accept="image/jpeg,image/png,image/webp" className="mt-3 text-sm font-bold text-zinc-300" multiple onChange={(event) => setFiles(event.target.files)} type="file" />
                  {files?.length ? <p className="mt-2 text-xs font-bold text-brand-neon">{Array.from(files).map((file) => file.name).join(', ')}</p> : null}
                  <button className={buttonClass('primary')} onClick={() => void uploadImages()} type="button">{t('Upload images', 'رفع الصور')}</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input className={inputClass()} placeholder="https://..." value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} />
                  <button className={buttonClass()} onClick={() => void addExternalImage()} type="button">{t('Add URL', 'إضافة رابط')}</button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {productImageRows.map((image, index) => (
                    <div className="rounded-md border border-white/10 bg-black p-2" draggable key={image.id} onDragStart={() => setDragImageId(Number(image.id))} onDragOver={(event) => event.preventDefault()} onDrop={() => void reorderImages(Number(image.id))}>
                      <FallbackImage alt="" className="aspect-square w-full rounded object-cover" src={image.url}>
                        <div className="grid aspect-square place-items-center rounded bg-red-500/10 text-xs font-black text-red-200">{t('Unavailable', 'لا تظهر')}</div>
                      </FallbackImage>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-zinc-500">{index === 0 ? t('Main', 'الرئيسية') : `#${index + 1}`}</span>
                        <button className={buttonClass('danger')} onClick={() => void deleteImage(image)} type="button">{t('Delete', 'حذف')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {activeSection === 'organization' ? (
              <Panel title={labels.organization}>
                <Field label={t('Category', 'القسم')}><select className={inputClass()} value={form.category_id ?? ''} onChange={(event) => updateField('category_id', event.target.value)}><option value="">{t('Select category', 'اختر القسم')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}</select></Field>
                <Field label={t('Brand', 'الماركة')}><select className={inputClass()} value={form.brand_id ?? ''} onChange={(event) => updateField('brand_id', event.target.value)}><option value="">{t('Select brand', 'اختر الماركة')}</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name_en}</option>)}</select></Field>
                <Field label={t('Tags', 'الوسوم')}><textarea className={areaClass()} value={form.tags ?? ''} onChange={(event) => updateField('tags', event.target.value)} /></Field>
                <Field label={t('Publication', 'النشر')}><select className={inputClass()} value={form.publication_status ?? 'published'} onChange={(event) => updateField('publication_status', event.target.value)}><option value="published">{t('Published', 'منشور')}</option><option value="draft">{t('Draft', 'مسودة')}</option><option value="archived">{t('Archived', 'مؤرشف')}</option></select></Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['is_featured', t('Featured', 'مميز')],
                    ['is_new', t('New Arrival', 'وصل حديثًا')],
                    ['is_offer', t('Offer', 'عرض')],
                    ['is_trending', t('Trending', 'رائج')]
                  ].map(([field, label]) => (
                    <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black p-3 text-sm font-black" key={field}>
                      <input checked={Boolean(form[field])} className="accent-brand-neon" onChange={(event) => updateField(field, event.target.checked)} type="checkbox" />
                      {label}
                    </label>
                  ))}
                </div>
              </Panel>
            ) : null}

            {activeSection === 'seo' ? (
              <Panel title={labels.seo}>
                <Field label={t('Slug', 'الرابط المختصر')}><input className={inputClass()} value={form.slug ?? ''} onChange={(event) => updateField('slug', event.target.value)} /></Field>
                <Field label={t('Meta Title', 'عنوان محركات البحث')}><input className={inputClass()} value={form.meta_title ?? ''} onChange={(event) => updateField('meta_title', event.target.value)} /></Field>
                <Field label={t('Meta Description', 'وصف محركات البحث')}><textarea className={areaClass()} value={form.meta_description ?? ''} onChange={(event) => updateField('meta_description', event.target.value)} /></Field>
              </Panel>
            ) : null}
          </aside>
        </section>
    </AdminShell>
  );
}

function Panel({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <section className="grid gap-3">
      <h3 className="text-lg font-black">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Field({label, required, children}: {label: string; required?: boolean; children: React.ReactNode}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase text-zinc-500">{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  );
}
