import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {Footer} from '@/components/Footer';
import {Header} from '@/components/Header';
import {ProductComparison} from '@/components/ProductComparison';
import {ProductExperience} from '@/components/ProductExperience';
import {ProductShareButton} from '@/components/ProductShareButton';
import {ProductStats} from '@/components/ProductStats';
import {SmartOrderFlow} from '@/components/SmartOrderFlow';
import {brandName, categoryName, formatPrice, productDescription, productName} from '@/lib/format';
import {getProduct, getProducts, getSettings} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function ProductPage({
  params
}: {
  params: Promise<{locale: string; id: string}>;
}) {
  const {locale: localeParam, id} = await params;
  const locale = localeParam as Locale;
  const t = await getTranslations();
  const [settings, product, products] = await Promise.all([getSettings(), getProduct(Number(id)), getProducts()]);

  if (!product) {
    notFound();
  }

  const specs = locale === 'ar' ? product.specifications_ar : product.specifications_en;

  return (
    <>
      <Header locale={locale} settings={settings} />
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[0.92fr_1.08fr]">
        <ProductExperience product={product} locale={locale} />
        <section className="rounded-2xl bg-white/[0.06] p-5 text-white shadow-neon md:p-8">
          <Link href={`/${locale}`} className="text-sm font-bold text-brand-neon">
            7phone ←
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
            {product.stock_status === 'available' ? 'متوفر الآن' : 'نفذ من المخزون'}
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              [t('brand'), brandName(product, locale)],
              [t('category'), categoryName(product, locale)],
              [t('condition'), product.condition],
              [t('warranty'), product.warranty],
              [t('installments'), product.installments],
              [t('storage'), product.storage.join(' / ')],
              [t('colors'), product.colors.join(' / ')]
            ].map(([label, value]) => (
              <div className="rounded-xl bg-black/40 p-4" key={label}>
                <dt className="text-xs font-black uppercase text-white/40">{label}</dt>
                <dd className="mt-1 font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <section className="mt-6">
            <h2 className="text-lg font-black">{t('specifications')}</h2>
            <ul className="mt-3 grid gap-2">
              {specs.map((spec) => (
                <li className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-semibold text-white/82" key={spec}>
                  {spec}
                </li>
              ))}
            </ul>
          </section>
          <div className="mt-8 grid grid-cols-2 gap-2">
            <a className="grid h-12 place-items-center rounded-xl bg-brand-neon text-sm font-black text-white" href="#order">{t('orderWhatsapp')}</a>
            <ProductShareButton product={product} locale={locale} />
          </div>
        </section>
        <div className="lg:col-span-2 grid gap-5">
          <ProductComparison product={product} related={products} locale={locale} />
          <SmartOrderFlow product={product} locale={locale} settings={settings} />
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
