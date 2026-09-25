import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {Footer} from '@/components/Footer';
import {Header} from '@/components/Header';
import {ProductDetailsContent} from '@/components/ProductDetailsContent';
import {TrustAndSocialSections} from '@/components/TrustAndSocialSections';
import {productDescription, productName} from '@/lib/format';
import {getProduct, getProducts, getSettings} from '@/lib/data';
import {primaryProductImage} from '@/lib/productNormalize';
import type {Locale} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string; id: string}>;
}): Promise<Metadata> {
  const {locale: localeParam, id} = await params;
  const locale = localeParam as Locale;
  const product = await getProduct(id);
  const path = `/${locale}/product/${id}`;

  if (!product) {
    const title = locale === 'ar' ? 'المنتج غير متوفر' : 'Product not available';

    return {
      title,
      description: title,
      alternates: {
        canonical: path,
        languages: {
          ar: `/ar/product/${id}`,
          en: `/en/product/${id}`
        }
      }
    };
  }

  const title = productName(product, locale);
  const description = productDescription(product, locale).replace(/\s+/g, ' ').trim().slice(0, 180) || title;
  const image = primaryProductImage(product) || '/images/7phone-logo.svg';

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        ar: `/ar/product/${product.id}`,
        en: `/en/product/${product.id}`
      }
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: '7Phone Bahrain',
      locale: locale === 'ar' ? 'ar_BH' : 'en_BH',
      type: 'website',
      images: [{url: image, alt: title}]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{locale: string; id: string}>;
}) {
  const {locale: localeParam, id} = await params;
  const locale = localeParam as Locale;
  const t = await getTranslations();
  const [settings, product, products] = await Promise.all([
    getSettings(),
    getProduct(id),
    getProducts()
  ]);

  if (!product) {
    return (
      <div className="storefront-shell min-h-screen bg-[#f5f5f7] text-[#111111]">
        <Header locale={locale} settings={settings} />
        <main className="mx-auto max-w-7xl px-4 py-10 text-[#111111]">
          <div className="rounded-[20px] border border-[#ececec] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <h1 className="text-2xl font-black">
              {locale === 'ar' ? 'المنتج غير متوفر حالياً' : 'Product is not available right now'}
            </h1>
          </div>
        </main>
        <TrustAndSocialSections locale={locale} />
        <Footer settings={settings} />
      </div>
    );
  }

  return (
    <div className="storefront-shell min-h-screen bg-[#f5f5f7] text-[#111111]">
      <Header locale={locale} settings={settings} />
      <ProductDetailsContent
        initialProduct={product}
        relatedProducts={products}
        locale={locale}
        settings={settings}
        labels={{
          back: '7phone ←',
          available: locale === 'ar' ? 'متوفر' : 'Available',
          out: locale === 'ar' ? 'غير متوفر' : 'Out of stock',
          brand: t('brand'),
          category: t('category'),
          condition: t('condition'),
          warranty: t('warranty'),
          installments: t('installments'),
          storage: t('storage'),
          colors: t('colors'),
          specifications: t('specifications'),
          orderWhatsapp: locale === 'ar' ? 'اشتر الآن' : 'Buy Now'
        }}
      />
      <TrustAndSocialSections locale={locale} />
      <Footer settings={settings} />
    </div>
  );
}
