import {getTranslations} from 'next-intl/server';
import {Footer} from '@/components/Footer';
import {Header} from '@/components/Header';
import {LocalProductDetailsFallback} from '@/components/LocalProductDetailsFallback';
import {ProductDetailsContent} from '@/components/ProductDetailsContent';
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
    return (
      <>
        <Header locale={locale} settings={settings} />
        <LocalProductDetailsFallback productId={Number(id)} locale={locale} settings={settings} />
        <Footer settings={settings} />
      </>
    );
  }

  return (
    <>
      <Header locale={locale} settings={settings} />
      <ProductDetailsContent
        initialProduct={product}
        relatedProducts={products}
        locale={locale}
        settings={settings}
        labels={{
          back: '7phone ←',
          available: locale === 'ar' ? 'متوفر الآن' : 'Available now',
          out: locale === 'ar' ? 'نفذ من المخزون' : 'Out of stock',
          brand: t('brand'),
          category: t('category'),
          condition: t('condition'),
          warranty: t('warranty'),
          installments: t('installments'),
          storage: t('storage'),
          colors: t('colors'),
          specifications: t('specifications'),
          orderWhatsapp: t('orderWhatsapp')
        }}
      />
      <Footer settings={settings} />
    </>
  );
}
