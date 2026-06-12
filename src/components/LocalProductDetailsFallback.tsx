'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {brandName, categoryName, formatPrice, productDescription, productName} from '@/lib/format';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {ProductExperience} from './ProductExperience';
import {ProductShareButton} from './ProductShareButton';
import {ProductStats} from './ProductStats';
import {WhatsAppButton} from './WhatsAppButton';

const localProductsKey = '7phone-local-products';

export function LocalProductDetailsFallback({
  productId,
  locale,
  settings
}: {
  productId: number;
  locale: Locale;
  settings: StoreSettings;
}) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const product = useMemo(
    () => products?.find((item) => item.id === productId) ?? null,
    [productId, products]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(localProductsKey);
      setProducts(saved ? (JSON.parse(saved) as Product[]) : []);
    } catch {
      setProducts([]);
    }
  }, []);

  if (products === null) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 text-white">
        <div className="rounded-2xl bg-white/[0.06] p-6 font-black shadow-neon">
          {locale === 'ar' ? 'جاري تحميل المنتج...' : 'Loading product...'}
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 text-white">
        <div className="rounded-2xl bg-white/[0.06] p-6 shadow-neon">
          <Link href={`/${locale}`} className="text-sm font-bold text-brand-neon">
            7phone ←
          </Link>
          <h1 className="mt-4 text-2xl font-black">
            {locale === 'ar' ? 'المنتج غير متوفر حالياً' : 'Product is not available right now'}
          </h1>
        </div>
      </main>
    );
  }

  const specs = locale === 'ar' ? product.specifications_ar : product.specifications_en;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[0.92fr_1.08fr]">
      <ProductExperience product={product} locale={locale} />
      <section className="rounded-2xl bg-white/[0.06] p-5 text-white shadow-neon md:p-8">
        <Link href={`/${locale}`} className="text-sm font-bold text-brand-neon">
          7phone ←
        </Link>
        <h1 className="mt-4 text-3xl font-black md:text-5xl">{productName(product, locale)}</h1>
        <div className="mt-3">
          <ProductStats product={product} locale={locale} />
        </div>
        <p className="mt-4 text-lg leading-8 text-white/70">{productDescription(product, locale)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <strong className="text-3xl font-black text-brand-neon">
            {formatPrice(product.price_bhd, locale)}
          </strong>
          {product.old_price_bhd ? (
            <span className="text-lg font-semibold text-zinc-400 line-through">
              {formatPrice(product.old_price_bhd, locale)}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm font-black text-white">{product.warranty}</p>
        <p className={`mt-2 text-sm font-black ${product.stock_status === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>
          {product.stock_status === 'available'
            ? locale === 'ar' ? 'متوفر الآن' : 'Available now'
            : locale === 'ar' ? 'نفذ من المخزون' : 'Out of stock'}
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            [locale === 'ar' ? 'الماركة' : 'Brand', brandName(product, locale)],
            [locale === 'ar' ? 'التصنيف' : 'Category', categoryName(product, locale)],
            [locale === 'ar' ? 'الحالة' : 'Condition', product.condition],
            [locale === 'ar' ? 'الضمان' : 'Warranty', product.warranty],
            [locale === 'ar' ? 'السعة' : 'Storage', product.storage.join(' / ') || '-'],
            [locale === 'ar' ? 'الألوان' : 'Colors', product.colors.join(' / ') || '-']
          ].map(([label, value]) => (
            <div className="rounded-xl bg-black/40 p-4" key={label}>
              <dt className="text-xs font-black uppercase text-white/40">{label}</dt>
              <dd className="mt-1 font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>
        {specs.length ? (
          <section className="mt-6">
            <h2 className="text-lg font-black">{locale === 'ar' ? 'المواصفات' : 'Specifications'}</h2>
            <ul className="mt-3 grid gap-2">
              {specs.map((spec) => (
                <li className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-semibold text-white/82" key={spec}>
                  {spec}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {product.accessories.length ? (
          <section className="mt-6">
            <h2 className="text-lg font-black">{locale === 'ar' ? 'اكسسوارات مقترحة' : 'Accessory suggestions'}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {product.accessories.map((item) => (
                <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-semibold text-white/82" key={item.id}>
                  <span>{locale === 'ar' ? item.name_ar : item.name_en}</span>
                  <span className="mt-1 block text-brand-neon">{formatPrice(item.price_bhd, locale)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <div className="mt-8 grid grid-cols-2 gap-2">
          <WhatsAppButton
            product={product}
            locale={locale}
            settings={settings}
            label={locale === 'ar' ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}
            large
          />
          <ProductShareButton product={product} locale={locale} />
        </div>
      </section>
    </main>
  );
}
