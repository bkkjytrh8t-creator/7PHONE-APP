import {getTranslations} from 'next-intl/server';
import {Footer} from '@/components/Footer';
import {Header} from '@/components/Header';
import {Hero} from '@/components/Hero';
import {SearchCatalog} from '@/components/SearchCatalog';
import {getCategories, getProducts, getSettings} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const t = await getTranslations();
  const [settings, categories, products] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts()
  ]);

  return (
    <>
      <Header locale={locale} settings={settings} />
      <Hero settings={settings} />
      <SearchCatalog
        locale={locale}
        products={products}
        categories={categories}
        settings={settings}
        labels={{
          all: t('all'),
          search: t('search'),
          order: t('orderWhatsapp'),
          offers: t('offers'),
          newArrivals: t('newArrivals'),
          bestSellers: t('bestSellers')
        }}
      />
      <Footer settings={settings} />
    </>
  );
}
