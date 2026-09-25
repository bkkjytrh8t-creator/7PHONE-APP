import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {DirectPurchaseCheckout} from '@/components/DirectPurchaseCheckout';
import {directPurchasePath, productIdFromDirectKey} from '@/lib/directPurchase';
import {getProduct, getSettings} from '@/lib/data';
import {productDescription, productName} from '@/lib/format';
import {primaryProductImage} from '@/lib/productNormalize';
import type {Locale} from '@/lib/types';

type DirectPurchaseProps = {
  params: Promise<{slug: string}>;
  searchParams: Promise<{lang?: string; v?: string}>;
};

async function directProduct(slug: string) {
  const decoded = decodeURIComponent(slug);
  const bySlug = await getProduct(decoded);
  if (bySlug) return bySlug;
  const productId = productIdFromDirectKey(decoded);
  return productId ? getProduct(productId) : null;
}

export async function generateMetadata({params, searchParams}: DirectPurchaseProps): Promise<Metadata> {
  const [{slug}, query] = await Promise.all([params, searchParams]);
  const locale: Locale = query.lang === 'en' ? 'en' : 'ar';
  const product = await directProduct(slug);
  if (!product) return {title: locale === 'ar' ? 'المنتج غير متوفر' : 'Product unavailable'};
  const title = `${productName(product, locale)} — ${locale === 'ar' ? 'شراء مباشر' : 'Buy now'}`;
  const description = productDescription(product, locale).replace(/\s+/g, ' ').trim().slice(0, 180) || title;
  return {
    title,
    description,
    alternates: {canonical: directPurchasePath(product, locale)},
    openGraph: {title, description, type: 'website', images: [{url: primaryProductImage(product), alt: productName(product, locale)}]}
  };
}

export default async function DirectPurchasePage({params, searchParams}: DirectPurchaseProps) {
  const [{slug}, query] = await Promise.all([params, searchParams]);
  const locale: Locale = query.lang === 'en' ? 'en' : 'ar';
  const [product, settings] = await Promise.all([directProduct(slug), getSettings()]);
  if (!product) notFound();
  const productPage = `/${locale}/product/${product.id}`;

  return (
    <>
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${productPage}`} />
        <a href={productPage}>{productName(product, locale)}</a>
      </noscript>
      <DirectPurchaseCheckout product={product} locale={locale} settings={settings} requestedSku={query.v} />
    </>
  );
}
