'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Brand, Category, Locale, Product} from '@/lib/types';

const localProductsKey = '7phone-local-products';

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
  window.dispatchEvent(new Event('7phone-products-updated'));
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
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [brandId, setBrandId] = useState(String(brands[0]?.id ?? ''));
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ''));
  const [storage, setStorage] = useState('');
  const [colors, setColors] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    setLocalProducts(readLocalProducts());
  }, []);

  const allProducts = useMemo(() => [...localProducts, ...seedProducts], [localProducts, seedProducts]);

  function onImageChange(file: File | null) {
    if (!file) {
      setImage('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const brand = brands.find((item) => item.id === Number(brandId)) ?? brands[0];
    const category = categories.find((item) => item.id === Number(categoryId)) ?? categories[0];
    const nextProduct: Product = {
      id: Date.now(),
      name_en: name,
      name_ar: name,
      description_en: name,
      description_ar: name,
      price_bhd: Number(price),
      old_price_bhd: null,
      storage_prices: storage.split(',').map((item) => item.trim()).filter(Boolean).map((item) => ({label: item, price_bhd: Number(price)})),
      accessories: [],
      comparison: {
        display: locale === 'ar' ? 'غير محدد' : 'Not set',
        camera: locale === 'ar' ? 'غير محدد' : 'Not set',
        battery: locale === 'ar' ? 'غير محدد' : 'Not set',
        processor: locale === 'ar' ? 'غير محدد' : 'Not set'
      },
      brand,
      category,
      condition: 'New',
      warranty: '1 year',
      installments: 'Available',
      badge: 'new',
      stock_status: 'available',
      views: 0,
      shares: 0,
      orders: 0,
      is_active: true,
      images: image ? [image] : [],
      storage: storage.split(',').map((item) => item.trim()).filter(Boolean),
      colors: colors.split(',').map((item) => item.trim()).filter(Boolean),
      specifications_en: [],
      specifications_ar: [],
      likes: 0,
      sold_count: 0,
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString()
    };

    const nextProducts = [nextProduct, ...localProducts];
    setLocalProducts(nextProducts);
    saveLocalProducts(nextProducts);
    setName('');
    setPrice('');
    setStorage('');
    setColors('');
    setImage('');
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
      <form className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4" onSubmit={submit}>
        <h2 className="text-xl font-black text-brand-ink">
          {locale === 'ar' ? 'إضافة بضاعة' : 'Add product'}
        </h2>
        <input
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-brand-neon"
          onChange={(event) => setName(event.target.value)}
          placeholder={locale === 'ar' ? 'اسم المنتج' : 'Product name'}
          required
          type="text"
          value={name}
        />
        <input
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-brand-neon"
          min="0"
          onChange={(event) => setPrice(event.target.value)}
          placeholder={locale === 'ar' ? 'السعر بالدينار' : 'Price in BHD'}
          required
          step="0.001"
          type="number"
          value={price}
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-brand-neon"
            onChange={(event) => setBrandId(event.target.value)}
            value={brandId}
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name_en}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-brand-neon"
            onChange={(event) => setCategoryId(event.target.value)}
            value={categoryId}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {locale === 'ar' ? category.name_ar : category.name_en}
              </option>
            ))}
          </select>
        </div>
        <input
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-brand-neon"
          onChange={(event) => setStorage(event.target.value)}
          placeholder={locale === 'ar' ? 'التخزين: 128GB, 256GB' : 'Storage: 128GB, 256GB'}
          type="text"
          value={storage}
        />
        <input
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-brand-neon"
          onChange={(event) => setColors(event.target.value)}
          placeholder={locale === 'ar' ? 'الألوان: أسود, أبيض' : 'Colors: Black, White'}
          type="text"
          value={colors}
        />
        <label className="grid gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm font-bold text-zinc-600">
          {locale === 'ar' ? 'رفع صورة المنتج' : 'Upload product image'}
          <input accept="image/*" onChange={(event) => onImageChange(event.target.files?.[0] ?? null)} type="file" />
        </label>
        {image ? (
          <img alt="" className="h-32 w-full rounded-xl object-cover" src={image} />
        ) : null}
        <button className="h-11 rounded-xl bg-brand-neon px-5 text-sm font-black text-white" type="submit">
          {locale === 'ar' ? 'حفظ المنتج' : 'Save product'}
        </button>
        <p className="text-xs font-semibold leading-5 text-zinc-500">
          {locale === 'ar'
            ? 'هذه نسخة سهلة تجريبية تحفظ على نفس المتصفح فقط. للموظفين والأجهزة المتعددة نربط Supabase.'
            : 'This preview saves in this browser only. For staff and multiple devices, connect Supabase.'}
        </p>
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {allProducts.map((product) => (
          <div className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-[64px_1fr_120px_90px]" key={product.id}>
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-zinc-100 text-xs font-black text-zinc-400">
              {product.images[0] ? <img alt="" className="h-full w-full object-cover" src={product.images[0]} /> : '7'}
            </div>
            <div>
              <strong className="block text-sm text-brand-ink">{locale === 'ar' ? product.name_ar : product.name_en}</strong>
              <span className="text-xs font-bold text-zinc-500">{product.brand.name_en}</span>
            </div>
            <span className="text-sm font-black text-brand-pink">BHD {product.price_bhd}</span>
            <span className="text-xs font-bold text-zinc-500">{product.is_active ? 'Active' : 'Hidden'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
