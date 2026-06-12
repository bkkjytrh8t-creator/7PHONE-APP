'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {brandName, categoryName, formatPrice, productDescription, productName} from '@/lib/format';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {ProductComparison} from './ProductComparison';
import {ProductExperience} from './ProductExperience';
import {ProductShareButton} from './ProductShareButton';
import {ProductStats} from './ProductStats';
import {SmartOrderFlow} from './SmartOrderFlow';
import {WhatsAppButton} from './WhatsAppButton';

const publicPreviewProductsKey = '7phone-local-products';

type ProductDetailsLabels = {
  back: string;
  available: string;
  out: string;
  brand: string;
  category: string;
  condition: string;
  warranty: string;
  installments: string;
  storage: string;
  colors: string;
  specifications: string;
  orderWhatsapp: string;
};

export function ProductDetailsContent({
  initialProduct,
  relatedProducts,
  locale,
  settings,
  labels
}: {
  initialProduct: Product;
  relatedProducts: Product[];
  locale: Locale;
  settings: StoreSettings;
  labels: ProductDetailsLabels;
}) {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  useEffect(() => {
    function loadLocalProducts() {
      try {
        const saved = window.localStorage.getItem(publicPreviewProductsKey);
        setLocalProducts(saved ? (JSON.parse(saved) as Product[]) : []);
      } catch {
        setLocalProducts([]);
      }
    }

    loadLocalProducts();
    window.addEventListener('7phone-products-updated', loadLocalProducts);
    window.addEventListener('storage', loadLocalProducts);

    return () => {
      window.removeEventListener('7phone-products-updated', loadLocalProducts);
      window.removeEventListener('storage', loadLocalProducts);
    };
  }, []);

  const product = useMemo(
    () => localProducts.find((item) => item.id === initialProduct.id) ?? initialProduct,
    [initialProduct, localProducts]
  );
  const related = useMemo(() => {
    const localIds = new Set(localProducts.map((item) => item.id));
    return [...localProducts, ...relatedProducts.filter((item) => !localIds.has(item.id))];
  }, [localProducts, relatedProducts]);
  const specs = locale === 'ar' ? product.specifications_ar : product.specifications_en;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[0.92fr_1.08fr]">
      <ProductExperience product={product} locale={locale} />
      <section className="rounded-2xl bg-white/[0.06] p-5 text-white shadow-neon md:p-8">
        <Link href={`/${locale}`} className="text-sm font-bold text-brand-neon">
          {labels.back}
        </Link>
        <h1 className="mt-4 text-3xl font-black md:text-5xl">
          {productName(product, locale)}
        </h1>
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
          {product.stock_status === 'available' ? labels.available : labels.out}
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            [labels.brand, brandName(product, locale)],
            [labels.category, categoryName(product, locale)],
            [labels.condition, product.condition],
            [labels.warranty, product.warranty],
            [labels.installments, product.installments],
            [labels.storage, product.storage.join(' / ')],
            [labels.colors, product.colors.join(' / ')]
          ].map(([label, value]) => (
            <div className="rounded-xl bg-black/40 p-4" key={label}>
              <dt className="text-xs font-black uppercase text-white/40">{label}</dt>
              <dd className="mt-1 font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <section className="mt-6">
          <h2 className="text-lg font-black">{labels.specifications}</h2>
          <ul className="mt-3 grid gap-2">
            {specs.map((spec) => (
              <li className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-semibold text-white/82" key={spec}>
                {spec}
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-8 grid grid-cols-2 gap-2">
          <WhatsAppButton product={product} locale={locale} settings={settings} label={labels.orderWhatsapp} large />
          <ProductShareButton product={product} locale={locale} />
        </div>
      </section>
      <div className="grid gap-5 lg:col-span-2">
        <ProductComparison product={product} related={related} locale={locale} />
        <SmartOrderFlow product={product} locale={locale} settings={settings} />
      </div>
    </main>
  );
}
