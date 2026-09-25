'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {brandName, categoryName, formatPrice, localizedProductList, localizedProductText, productDescription, productName} from '@/lib/format';
import {normalizeProduct, normalizeProducts, primaryProductImage} from '@/lib/productNormalize';
import {productIsOutOfStock} from '@/lib/stock';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {whatsappNotifyWhenAvailableUrl} from '@/lib/whatsapp';
import {defaultProductVariant, variantAvailable, variantColor, variantPrice} from '@/lib/variants';
import {FallbackImage} from './FallbackImage';
import {ProductComparison} from './ProductComparison';
import {ProductContentBlocks} from './ProductContentBlocks';
import {ProductExperience} from './ProductExperience';
import {ProductShareButton} from './ProductShareButton';
import {SmartOrderFlow} from './SmartOrderFlow';
import {WhatsAppButton} from './WhatsAppButton';
import type {ProductContentBlock} from '@/lib/productContent';

type ProductDetailsLabels = {
  back: string; available: string; out: string; brand: string; category: string;
  condition: string; warranty: string; installments: string; storage: string;
  colors: string; specifications: string; orderWhatsapp: string;
};

export function ProductDetailsContent({initialProduct, relatedProducts, locale, settings, labels}: {
  initialProduct: Product; relatedProducts: Product[]; locale: Locale; settings: StoreSettings; labels: ProductDetailsLabels;
}) {
  const product = useMemo(() => normalizeProduct(initialProduct), [initialProduct]);
  const related = useMemo(() => normalizeProducts(relatedProducts).filter((item) => item.id !== product.id).sort((a, b) => {
    const aScore = Number(a.category.id === product.category.id) * 3 + Number(a.brand.id === product.brand.id) * 2 - Math.abs(a.price_bhd - product.price_bhd) / 1000;
    const bScore = Number(b.category.id === product.category.id) * 3 + Number(b.brand.id === product.brand.id) * 2 - Math.abs(b.price_bhd - product.price_bhd) / 1000;
    return bScore - aScore;
  }).slice(0, 4), [product, relatedProducts]);
  const specs = localizedProductList(product, 'specifications', locale);
  const detailSpecs = localizedProductList(product, 'details_specifications', locale);
  const shortDescription = localizedProductText(product, 'short_description', locale);
  const warranty = localizedProductText(product, 'warranty', locale);
  const warrantyDetails = localizedProductText(product, 'warranty_details', locale);
  const variants = product.variants ?? [];
  const [selectedVariant, setSelectedVariant] = useState(() => defaultProductVariant(product));
  const requiresLegacyColor = !variants.length && Boolean(product.color_options?.length || product.colors.length);
  const colorSelected = Boolean(selectedVariant && variantColor(selectedVariant, locale));
  const isOutOfStock = variants.length ? !selectedVariant || !variantAvailable(selectedVariant) : productIsOutOfStock(product);
  const activePrice = variantPrice(product, selectedVariant);
  const hasDiscount = Boolean(product.old_price_bhd && product.old_price_bhd > activePrice);
  const savedDescription = productDescription(product, locale) || shortDescription;
  const detailContent = useMemo<ProductContentBlock[]>(() => {
    if (product.product_content_blocks?.length) return product.product_content_blocks;
    const blocks: ProductContentBlock[] = [];
    if (savedDescription) blocks.push({id: 'saved-product-description', type: 'text', text: savedDescription, width: 'large'});
    const savedSpecifications = [...new Set([...specs, ...detailSpecs])];
    if (savedSpecifications.length) blocks.push({
      id: 'saved-product-specifications', type: 'specifications', width: 'large',
      items: savedSpecifications.map((item) => {
        const [label, ...value] = item.split(/\s*(?:\||:|：)\s*/);
        return {label: value.length ? label : item, value: value.join(' | ')};
      })
    });
    return blocks;
  }, [detailSpecs, product.product_content_blocks, savedDescription, specs]);

  return (
    <main className="storefront-product mx-auto max-w-7xl px-4 pb-28 pt-6 text-[#111] md:pb-12 md:pt-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-zinc-500">
        <Link className="transition hover:text-brand-neon" href={`/${locale}`}>{labels.back}</Link>
        <span aria-hidden>/</span>
        <span>{categoryName(product, locale)}</span>
        <span aria-hidden>/</span>
        <span className="max-w-[60vw] truncate text-zinc-900">{productName(product, locale)}</span>
      </nav>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)] lg:items-start">
        <ProductExperience product={product} locale={locale} selectedVariant={selectedVariant} onVariantChange={setSelectedVariant} />

        <section className="min-w-0 rounded-[24px] border border-[#ececec] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.05)] md:p-7 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-500">
            <span className="text-brand-neon">{brandName(product, locale)}</span><span>•</span><span>{categoryName(product, locale)}</span>
          </div>
          <h1 className="mt-3 break-words text-3xl font-black leading-tight md:text-4xl">{productName(product, locale)}</h1>
          {shortDescription ? <p className="mt-4 text-base font-semibold leading-7 text-zinc-600">{shortDescription}</p> : null}

          <div className="mt-6 flex flex-wrap items-end gap-3 border-y border-[#ececec] py-5">
            <strong className="text-3xl font-black text-brand-neon md:text-4xl">{formatPrice(activePrice, locale)}</strong>
            {hasDiscount ? <span className="pb-1 text-base font-semibold text-zinc-400 line-through">{formatPrice(product.old_price_bhd!, locale)}</span> : null}
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className={`rounded-full px-3 py-1.5 text-sm font-black ${isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{isOutOfStock ? labels.out : labels.available}</span>
            {warranty ? <span className="text-sm font-bold text-zinc-600">{warranty}</span> : null}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            {[[labels.brand, brandName(product, locale)], [labels.category, categoryName(product, locale)], [labels.condition, localizedProductText(product, 'condition', locale)], ['SKU', selectedVariant?.sku]].filter(([, value]) => Boolean(value)).map(([label, value]) => (
              <div className="rounded-2xl bg-[#f5f5f7] p-3" key={label}><dt className="text-[11px] font-black uppercase text-zinc-400">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-zinc-800">{value}</dd></div>
            ))}
          </dl>

          <div className="mt-6 grid gap-3">
            {requiresLegacyColor && !colorSelected ? <button className="min-h-12 rounded-full bg-brand-neon px-6 py-3.5 text-base font-black text-white" type="button">{locale === 'ar' ? 'اختر اللون أولاً' : 'Choose a color first'}</button> : <WhatsAppButton product={product} locale={locale} settings={settings} label={labels.orderWhatsapp} selectedVariant={selectedVariant} large />}
            <ProductShareButton product={product} locale={locale} selectedVariant={selectedVariant} />
            {isOutOfStock ? <a className="grid min-h-12 place-items-center rounded-xl border border-zinc-200 px-4 text-center text-sm font-black text-zinc-700 hover:border-brand-neon" href={whatsappNotifyWhenAvailableUrl(product, locale, settings)} target="_blank" rel="noreferrer">{locale === 'ar' ? 'أبلغني عند توفر المنتج' : 'Notify Me When Available'}</a> : null}
          </div>

          <div className="mt-6 grid gap-2 border-t border-[#ececec] pt-5 text-sm font-bold text-zinc-600">
            <p>✓ {locale === 'ar' ? 'ضمان واضح وخدمة ما بعد البيع' : 'Clear warranty and after-sales support'}</p>
            <p>✓ {locale === 'ar' ? 'توصيل لجميع مناطق البحرين' : 'Delivery across Bahrain'}</p>
            <p>✓ {locale === 'ar' ? 'الدفع عبر BenefitPay أو عند الاستلام' : 'BenefitPay or cash on delivery'}</p>
          </div>
        </section>
      </div>

      <ProductContentBlocks blocks={detailContent} locale={locale} />

      {related.length ? <section className="mt-10"><h2 className="text-2xl font-black">{locale === 'ar' ? 'منتجات مشابهة' : 'Related Products'}</h2><div className="hide-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:overflow-visible">{related.map((item) => <Link className="min-w-[72vw] snap-start rounded-[20px] border border-[#ececec] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.05)] md:min-w-0" href={`/${locale}/product/${item.id}`} key={item.id}><div className="aspect-square rounded-2xl bg-[#f5f5f7] p-3"><FallbackImage alt={productName(item, locale)} className="h-full w-full object-contain" src={primaryProductImage(item)}><div /></FallbackImage></div><h3 className="mt-3 line-clamp-2 min-h-10 font-black">{productName(item, locale)}</h3><strong className="mt-2 block text-brand-neon">{formatPrice(item.price_bhd, locale)}</strong></Link>)}</div></section> : null}

      <div className="mt-8 grid gap-5">
        <ProductComparison product={product} related={related} locale={locale} />
        <SmartOrderFlow product={product} locale={locale} settings={settings} />
      </div>

      {!isOutOfStock ? <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-[#ececec] bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,.08)] backdrop-blur md:hidden"><strong className="shrink-0 text-lg font-black text-brand-neon">{formatPrice(activePrice, locale)}</strong><div className="min-w-0 flex-1">{requiresLegacyColor && !colorSelected ? <button className="h-12 w-full rounded-full bg-brand-neon text-sm font-black text-white" type="button">{locale === 'ar' ? 'اختر اللون أولاً' : 'Choose color first'}</button> : <WhatsAppButton product={product} locale={locale} settings={settings} label={labels.orderWhatsapp} selectedVariant={selectedVariant} large />}</div></div> : null}
    </main>
  );
}
