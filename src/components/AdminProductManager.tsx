'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Badge, Brand, Category, Locale, Product} from '@/lib/types';

const localProductsKey = '7phone-admin-products';
const publicPreviewProductsKey = '7phone-local-products';

type ProductForm = {
  id?: number;
  name_ar: string;
  name_en: string;
  brandId: string;
  categoryId: string;
  price_bhd: string;
  old_price_bhd: string;
  storage: string;
  colors: string;
  stock_status: string;
  warranty: string;
  description_ar: string;
  description_en: string;
  specifications_ar: string;
  specifications_en: string;
  images: string;
  featured: boolean;
  newArrival: boolean;
  offer: boolean;
  displayOrder: string;
  accessories: string;
};

const emptyForm: ProductForm = {
  name_ar: '',
  name_en: '',
  brandId: '',
  categoryId: '',
  price_bhd: '',
  old_price_bhd: '',
  storage: '',
  colors: '',
  stock_status: 'available',
  warranty: '',
  description_ar: '',
  description_en: '',
  specifications_ar: '',
  specifications_en: '',
  images: '',
  featured: false,
  newArrival: false,
  offer: false,
  displayOrder: '0',
  accessories: ''
};

const ui = {
  en: {
    add: 'Add product',
    edit: 'Edit product',
    save: 'Save product',
    update: 'Update product',
    cancel: 'Cancel',
    delete: 'Delete',
    editButton: 'Edit',
    active: 'Available',
    hidden: 'Hidden / out',
    temp: 'Temporary data layer: changes are saved in this admin browser only and do not overwrite the live product seed yet.',
    image: 'Upload or change product image',
    approveUpload: 'Approve & Upload Image',
    replaceImage: 'Replace current product image',
    deleteImage: 'Delete image',
    imageHelp: 'JPG, PNG, or WEBP only. Maximum 3 MB.',
    noProductForUpload: 'Save or edit a real product before uploading images.',
    imageReady: 'Preview ready. Approve to upload.',
    imageUploaded: 'Image uploaded and saved to product data.',
    imageDeleted: 'Image deleted from product data.',
    imageTypeError: 'Only JPG, PNG, and WEBP images are allowed.',
    imageSizeError: 'Image is too large. Maximum size is 3 MB.',
    list: 'Product list',
    saved: 'Saved in temporary admin storage.',
    fields: {
      name_ar: 'Product name Arabic',
      name_en: 'Product name English',
      brand: 'Brand',
      category: 'Category',
      price: 'Price',
      oldPrice: 'Old price optional',
      storage: 'Storage variants',
      colors: 'Color variants',
      warranty: 'Warranty type',
      description_ar: 'Arabic description',
      description_en: 'English description',
      specs_ar: 'Short / full specs Arabic',
      specs_en: 'Short / full specs English',
      images: 'Product image URLs',
      order: 'Display order',
      accessories: 'Accessory suggestions'
    },
    toggles: {
      featured: 'Featured product',
      newArrival: 'New arrival',
      offer: 'Offer'
    }
  },
  ar: {
    add: 'إضافة منتج',
    edit: 'تعديل المنتج',
    save: 'حفظ المنتج',
    update: 'تحديث المنتج',
    cancel: 'إلغاء',
    delete: 'حذف',
    editButton: 'تعديل',
    active: 'متوفر',
    hidden: 'مخفي / غير متوفر',
    temp: 'طبقة بيانات مؤقتة: التعديلات تحفظ في متصفح الإدارة فقط ولا تستبدل بيانات الموقع الحي بعد.',
    image: 'رفع أو تغيير صورة المنتج',
    approveUpload: 'اعتماد ورفع الصورة',
    replaceImage: 'استبدال صورة المنتج الحالية',
    deleteImage: 'حذف الصورة',
    imageHelp: 'JPG أو PNG أو WEBP فقط. الحد الأقصى 3MB.',
    noProductForUpload: 'احفظ أو عدّل منتجاً حقيقياً قبل رفع الصور.',
    imageReady: 'المعاينة جاهزة. اضغط اعتماد للرفع.',
    imageUploaded: 'تم رفع الصورة وحفظها في بيانات المنتج.',
    imageDeleted: 'تم حذف الصورة من بيانات المنتج.',
    imageTypeError: 'يسمح فقط بصور JPG و PNG و WEBP.',
    imageSizeError: 'حجم الصورة كبير. الحد الأقصى 3MB.',
    list: 'قائمة المنتجات',
    saved: 'تم الحفظ في التخزين المؤقت للإدارة.',
    fields: {
      name_ar: 'اسم المنتج عربي',
      name_en: 'اسم المنتج إنجليزي',
      brand: 'العلامة',
      category: 'التصنيف',
      price: 'السعر',
      oldPrice: 'السعر القديم اختياري',
      storage: 'خيارات التخزين',
      colors: 'خيارات الألوان',
      warranty: 'نوع الضمان',
      description_ar: 'الوصف العربي',
      description_en: 'الوصف الإنجليزي',
      specs_ar: 'المواصفات المختصرة/الكاملة عربي',
      specs_en: 'المواصفات المختصرة/الكاملة إنجليزي',
      images: 'روابط صور المنتج',
      order: 'ترتيب العرض',
      accessories: 'اقتراحات الاكسسوارات'
    },
    toggles: {
      featured: 'منتج مميز',
      newArrival: 'وصل حديثاً',
      offer: 'عرض'
    }
  }
};

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readLocalProducts() {
  try {
    const saved = window.localStorage.getItem(localProductsKey);
    return saved ? (JSON.parse(saved) as Product[]) : [];
  } catch {
    return [];
  }
}

function saveLocalProducts(products: Product[]) {
  window.localStorage.setItem(localProductsKey, JSON.stringify(products));
  window.localStorage.setItem(publicPreviewProductsKey, JSON.stringify(products));
  window.dispatchEvent(new Event('7phone-products-updated'));
}

function badgeFromForm(form: ProductForm): Badge {
  if (form.offer) return 'deal';
  if (form.newArrival) return 'new';
  if (form.featured) return 'best-seller';
  return 'none';
}

function formFromProduct(product: Product): ProductForm {
  return {
    id: product.id,
    name_ar: product.name_ar,
    name_en: product.name_en,
    brandId: String(product.brand.id),
    categoryId: String(product.category.id),
    price_bhd: String(product.price_bhd),
    old_price_bhd: product.old_price_bhd ? String(product.old_price_bhd) : '',
    storage: product.storage.join(', '),
    colors: product.colors.join(', '),
    stock_status: product.stock_status,
    warranty: product.warranty,
    description_ar: product.description_ar,
    description_en: product.description_en,
    specifications_ar: product.specifications_ar.join('\n'),
    specifications_en: product.specifications_en.join('\n'),
    images: product.images.join('\n'),
    featured: product.badge === 'best-seller',
    newArrival: product.badge === 'new',
    offer: product.badge === 'deal',
    displayOrder: String(product.views ?? 0),
    accessories: product.accessories.map((item) => `${item.name_en} / ${item.name_ar} / ${item.price_bhd}`).join('\n')
  };
}

function productFromForm(form: ProductForm, brands: Brand[], categories: Category[], fallback?: Product): Product {
  const brand = brands.find((item) => item.id === Number(form.brandId)) ?? brands[0];
  const category = categories.find((item) => item.id === Number(form.categoryId)) ?? categories[0];
  const storage = splitList(form.storage);
  const price = Number(form.price_bhd || 0);

  return {
    id: form.id ?? Date.now(),
    name_en: form.name_en.trim(),
    name_ar: form.name_ar.trim(),
    description_en: form.description_en.trim(),
    description_ar: form.description_ar.trim(),
    price_bhd: price,
    old_price_bhd: form.old_price_bhd ? Number(form.old_price_bhd) : null,
    storage_prices: storage.map((label) => ({label, price_bhd: price})),
    accessories: splitList(form.accessories).map((item, index) => {
      const [name_en = item, name_ar = item, price_bhd = '0'] = item.split('/').map((part) => part.trim());
      return {id: index + 1, name_en, name_ar, price_bhd: Number(price_bhd), category: 'suggested'};
    }),
    comparison: fallback?.comparison ?? {
      display: '',
      camera: '',
      battery: '',
      processor: ''
    },
    brand,
    category,
    condition: fallback?.condition ?? 'New',
    warranty: form.warranty.trim(),
    installments: fallback?.installments ?? 'Available',
    badge: badgeFromForm(form),
    stock_status: form.stock_status,
    views: Number(form.displayOrder || fallback?.views || 0),
    shares: fallback?.shares ?? 0,
    orders: fallback?.orders ?? 0,
    is_active: form.stock_status === 'available',
    images: splitList(form.images),
    storage,
    colors: splitList(form.colors),
    specifications_en: splitList(form.specifications_en),
    specifications_ar: splitList(form.specifications_ar),
    likes: fallback?.likes ?? 0,
    sold_count: fallback?.sold_count ?? 0,
    rating: fallback?.rating ?? 0,
    review_count: fallback?.review_count ?? 0,
    created_at: fallback?.created_at ?? new Date().toISOString()
  };
}

export function AdminProductManager({
  locale,
  seedProducts,
  categories,
  brands
}: {
  locale: Locale;
  seedProducts: Product[];
  categories: Category[];
  brands: Brand[];
}) {
  const copy = ui[locale];
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [replaceExistingImage, setReplaceExistingImage] = useState(true);
  const [imageStatus, setImageStatus] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    ...emptyForm,
    brandId: String(brands[0]?.id ?? ''),
    categoryId: String(categories[0]?.id ?? '')
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLocalProducts(readLocalProducts());
  }, []);

  const allProducts = useMemo(() => {
    const localIds = new Set(localProducts.map((product) => product.id));
    return [...localProducts, ...seedProducts.filter((product) => !localIds.has(product.id))];
  }, [localProducts, seedProducts]);

  function updateField(field: keyof ProductForm, value: string | boolean) {
    setForm((current) => ({...current, [field]: value}));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      brandId: String(brands[0]?.id ?? ''),
      categoryId: String(categories[0]?.id ?? '')
    });
    setSelectedImage(null);
    setImagePreview('');
    setImageStatus('');
  }

  function persist(nextProducts: Product[]) {
    setLocalProducts(nextProducts);
    saveLocalProducts(nextProducts);
    setStatus(copy.saved);
  }

  function upsertProductFromForm(nextForm: ProductForm) {
    const fallback = allProducts.find((product) => product.id === nextForm.id);
    const nextProduct = productFromForm(nextForm, brands, categories, fallback);
    const isExistingLocalProduct = localProducts.some((product) => product.id === nextForm.id);
    const nextProducts = nextForm.id && isExistingLocalProduct
      ? localProducts.map((product) => (product.id === nextForm.id ? nextProduct : product))
      : [nextProduct, ...localProducts];

    persist(nextProducts);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fallback = allProducts.find((product) => product.id === form.id);
    const nextProduct = productFromForm(form, brands, categories, fallback);
    const isExistingLocalProduct = localProducts.some((product) => product.id === form.id);
    const nextProducts = form.id && isExistingLocalProduct
      ? localProducts.map((product) => (product.id === form.id ? nextProduct : product))
      : [nextProduct, ...localProducts];

    persist(nextProducts);
    resetForm();
  }

  function editProduct(product: Product) {
    setForm(formFromProduct(product));
    setReplaceExistingImage(Boolean(product.images[0]));
    setSelectedImage(null);
    setImagePreview('');
    setImageStatus('');
    setStatus('');
  }

  function deleteProduct(product: Product) {
    const hiddenProduct = {...product, is_active: false, stock_status: 'deleted'};
    const existsLocally = localProducts.some((item) => item.id === product.id);
    const nextProducts = existsLocally
      ? localProducts.map((item) => (item.id === product.id ? hiddenProduct : item))
      : [hiddenProduct, ...localProducts];

    persist(nextProducts);
  }

  function syncUploadedImage(url: string, replaceExisting: boolean) {
    setForm((current) => {
      const currentImages = splitList(current.images);
      const nextImages = replaceExisting ? [url] : [...currentImages, url];

      const nextForm = {
        ...current,
        images: nextImages.join('\n')
      };

      upsertProductFromForm(nextForm);

      return nextForm;
    });
  }

  function removeImageFromForm(url: string) {
    setForm((current) => {
      const nextForm = {
        ...current,
        images: splitList(current.images).filter((imageUrl) => imageUrl !== url).join('\n')
      };

      upsertProductFromForm(nextForm);

      return nextForm;
    });
  }

  function onImageChange(file: File | null) {
    setSelectedImage(null);
    setImagePreview('');

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageStatus(copy.imageTypeError);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setImageStatus(copy.imageSizeError);
      return;
    }

    setSelectedImage(file);
    setImageStatus(copy.imageReady);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function approveUploadImage() {
    if (!selectedImage || !form.id) {
      setImageStatus(copy.noProductForUpload);
      return;
    }

    setIsUploadingImage(true);
    setImageStatus('');

    const body = new FormData();
    body.set('productId', String(form.id));
    body.set('replaceExisting', String(replaceExistingImage));
    body.set('file', selectedImage);

    try {
      const response = await fetch('/api/admin/product-images', {
        method: 'POST',
        body
      });
      const result = (await response.json()) as {ok?: boolean; url?: string; message?: string};

      if (!response.ok || !result.ok || !result.url) {
        setImageStatus(result.message || (locale === 'ar' ? 'فشل رفع الصورة.' : 'Image upload failed.'));
        return;
      }

      syncUploadedImage(result.url, replaceExistingImage);
      setSelectedImage(null);
      setImagePreview('');
      setImageStatus(copy.imageUploaded);
    } catch {
      setImageStatus(locale === 'ar' ? 'تعذر الاتصال بخدمة رفع الصور.' : 'Could not reach the image upload service.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function deleteUploadedImage(url: string) {
    if (!form.id) {
      removeImageFromForm(url);
      return;
    }

    try {
      const response = await fetch('/api/admin/product-images', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({productId: form.id, url})
      });
      const result = (await response.json()) as {message?: string};

      if (!response.ok) {
        setImageStatus(result.message || (locale === 'ar' ? 'فشل حذف الصورة.' : 'Image delete failed.'));
        return;
      }

      removeImageFromForm(url);
      setImageStatus(copy.imageDeleted);
    } catch {
      setImageStatus(locale === 'ar' ? 'تعذر الاتصال بخدمة حذف الصور.' : 'Could not reach the image delete service.');
    }
  }

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(360px,520px)_1fr]">
      <form className="grid gap-3 rounded-lg border border-white/10 bg-black/30 p-4" onSubmit={submit}>
        <div>
          <h3 className="text-xl font-black text-white">{form.id ? copy.edit : copy.add}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-zinc-500">{copy.temp}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label={copy.fields.name_ar}>
            <input className="admin-input" onChange={(event) => updateField('name_ar', event.target.value)} required value={form.name_ar} />
          </Field>
          <Field label={copy.fields.name_en}>
            <input className="admin-input" onChange={(event) => updateField('name_en', event.target.value)} required value={form.name_en} />
          </Field>
          <Field label={copy.fields.brand}>
            <select className="admin-input" onChange={(event) => updateField('brandId', event.target.value)} value={form.brandId}>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name_en}</option>)}
            </select>
          </Field>
          <Field label={copy.fields.category}>
            <select className="admin-input" onChange={(event) => updateField('categoryId', event.target.value)} value={form.categoryId}>
              {categories.map((category) => <option key={category.id} value={category.id}>{locale === 'ar' ? category.name_ar : category.name_en}</option>)}
            </select>
          </Field>
          <Field label={copy.fields.price}>
            <input className="admin-input" min="0" onChange={(event) => updateField('price_bhd', event.target.value)} required step="0.001" type="number" value={form.price_bhd} />
          </Field>
          <Field label={copy.fields.oldPrice}>
            <input className="admin-input" min="0" onChange={(event) => updateField('old_price_bhd', event.target.value)} step="0.001" type="number" value={form.old_price_bhd} />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label={copy.fields.storage}>
            <input className="admin-input" onChange={(event) => updateField('storage', event.target.value)} placeholder="256GB, 512GB" value={form.storage} />
          </Field>
          <Field label={copy.fields.colors}>
            <input className="admin-input" onChange={(event) => updateField('colors', event.target.value)} placeholder="Black, White" value={form.colors} />
          </Field>
        </div>

        <Field label={copy.fields.warranty}>
          <input className="admin-input" onChange={(event) => updateField('warranty', event.target.value)} required value={form.warranty} />
        </Field>
        <Field label={copy.fields.description_ar}>
          <textarea className="admin-textarea" onChange={(event) => updateField('description_ar', event.target.value)} required value={form.description_ar} />
        </Field>
        <Field label={copy.fields.description_en}>
          <textarea className="admin-textarea" onChange={(event) => updateField('description_en', event.target.value)} required value={form.description_en} />
        </Field>
        <Field label={copy.fields.specs_ar}>
          <textarea className="admin-textarea" onChange={(event) => updateField('specifications_ar', event.target.value)} value={form.specifications_ar} />
        </Field>
        <Field label={copy.fields.specs_en}>
          <textarea className="admin-textarea" onChange={(event) => updateField('specifications_en', event.target.value)} value={form.specifications_en} />
        </Field>
        <Field label={copy.fields.accessories}>
          <textarea className="admin-textarea" onChange={(event) => updateField('accessories', event.target.value)} placeholder="Case / كفر / 5" value={form.accessories} />
        </Field>

        <div className="grid gap-3 md:grid-cols-[1fr_190px]">
          <Field label={copy.fields.images}>
            <textarea className="admin-textarea" onChange={(event) => updateField('images', event.target.value)} value={form.images} />
          </Field>
          <label className="grid content-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-3 text-xs font-black text-zinc-300">
            {copy.image}
            <input accept="image/jpeg,image/png,image/webp" className="text-xs" onChange={(event) => onImageChange(event.target.files?.[0] ?? null)} type="file" />
            <span className="text-[11px] font-bold leading-4 text-zinc-500">{copy.imageHelp}</span>
          </label>
        </div>

        <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          {imagePreview ? (
            <img alt="" className="max-h-56 w-full rounded-md object-contain" src={imagePreview} />
          ) : null}
          <label className="flex items-center gap-2 text-sm font-black text-zinc-200">
            <input checked={replaceExistingImage} onChange={(event) => setReplaceExistingImage(event.target.checked)} type="checkbox" />
            {copy.replaceImage}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-md bg-brand-neon px-4 text-xs font-black text-white disabled:opacity-50"
              disabled={!selectedImage || isUploadingImage}
              onClick={approveUploadImage}
              type="button"
            >
              {isUploadingImage ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...') : copy.approveUpload}
            </button>
          </div>
          {splitList(form.images).length ? (
            <div className="grid gap-2">
              {splitList(form.images).map((imageUrl) => (
                <div className="grid gap-2 rounded-md border border-white/10 bg-black/30 p-2 sm:grid-cols-[52px_1fr_auto] sm:items-center" key={imageUrl}>
                  <div className="grid h-12 w-12 place-items-center overflow-hidden rounded bg-white/5">
                    <img alt="" className="h-full w-full object-cover" src={imageUrl} />
                  </div>
                  <span className="min-w-0 truncate text-xs font-bold text-zinc-400">{imageUrl}</span>
                  <button
                    className="rounded-md bg-red-500/15 px-3 py-2 text-xs font-black text-red-200"
                    onClick={() => deleteUploadedImage(imageUrl)}
                    type="button"
                  >
                    {copy.deleteImage}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {imageStatus ? <p className="rounded-md bg-white/5 px-3 py-2 text-sm font-bold text-zinc-200">{imageStatus}</p> : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label={locale === 'ar' ? 'حالة التوفر' : 'Availability status'}>
            <select className="admin-input" onChange={(event) => updateField('stock_status', event.target.value)} value={form.stock_status}>
              <option value="available">{copy.active}</option>
              <option value="out">{copy.hidden}</option>
            </select>
          </Field>
          <Field label={copy.fields.order}>
            <input className="admin-input" onChange={(event) => updateField('displayOrder', event.target.value)} type="number" value={form.displayOrder} />
          </Field>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['featured', copy.toggles.featured],
            ['newArrival', copy.toggles.newArrival],
            ['offer', copy.toggles.offer]
          ].map(([field, label]) => (
            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-black text-zinc-200" key={field}>
              <input checked={Boolean(form[field as keyof ProductForm])} onChange={(event) => updateField(field as keyof ProductForm, event.target.checked)} type="checkbox" />
              {label}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="h-11 rounded-md bg-brand-neon px-5 text-sm font-black text-white" type="submit">
            {form.id ? copy.update : copy.save}
          </button>
          {form.id ? (
            <button className="h-11 rounded-md border border-white/10 px-5 text-sm font-black text-zinc-200" onClick={resetForm} type="button">
              {copy.cancel}
            </button>
          ) : null}
        </div>
        {status ? <p className="rounded-md bg-brand-neon/10 px-3 py-2 text-sm font-bold text-pink-100">{status}</p> : null}
      </form>

      <div className="rounded-lg border border-white/10 bg-black/30">
        <div className="border-b border-white/10 p-4">
          <h3 className="text-xl font-black text-white">{copy.list}</h3>
        </div>
        <div className="grid max-h-[980px] gap-0 overflow-auto">
          {allProducts.map((product) => (
            <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-[68px_1fr_auto]" key={product.id}>
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-md bg-white/5 text-xs font-black text-zinc-500">
                {product.images[0] ? <img alt="" className="h-full w-full object-cover" src={product.images[0]} /> : '7'}
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm text-white">{locale === 'ar' ? product.name_ar : product.name_en}</strong>
                <span className="text-xs font-bold text-zinc-500">{product.brand.name_en} · {product.category.name_en}</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-brand-neon/15 px-2 py-1 text-xs font-black text-brand-neon">BHD {product.price_bhd}</span>
                  <span className="rounded bg-white/5 px-2 py-1 text-xs font-black text-zinc-300">{product.stock_status}</span>
                  <span className="rounded bg-white/5 px-2 py-1 text-xs font-black text-zinc-300">{product.badge}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 md:justify-end">
                <button className="rounded-md border border-white/10 px-3 py-2 text-xs font-black text-zinc-200" onClick={() => editProduct(product)} type="button">
                  {copy.editButton}
                </button>
                <button className="rounded-md bg-red-500/15 px-3 py-2 text-xs font-black text-red-200" onClick={() => deleteProduct(product)} type="button">
                  {copy.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase text-zinc-400">
      {label}
      {children}
    </label>
  );
}
