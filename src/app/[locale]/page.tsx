import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {Footer} from '@/components/Footer';
import {Header} from '@/components/Header';
import {Hero} from '@/components/Hero';
import {activeHomepageConfig, configOf, managedHomepageHeroExists, PublishedHomepageBanners} from '@/components/PublishedHomepageBanners';
import {SearchCatalog} from '@/components/SearchCatalog';
import {TrustAndSocialSections} from '@/components/TrustAndSocialSections';
import {getBrands, getCategories, getHomepageSections, getProducts, getSettings} from '@/lib/data';
import type {Locale} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const isArabic = locale === 'ar';
  const title = isArabic ? '7Phone البحرين' : '7Phone Bahrain';
  const description = isArabic
    ? 'هواتف، اكسسوارات، عروض، وخدمة طلب عبر واتساب من 7Phone البحرين.'
    : 'Phones, accessories, offers, and WhatsApp ordering from 7Phone Bahrain.';
  const path = `/${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        ar: '/ar',
        en: '/en'
      }
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: '7Phone Bahrain',
      locale: isArabic ? 'ar_BH' : 'en_BH',
      type: 'website',
      images: [{url: '/images/7phone-logo.svg', width: 512, height: 512, alt: title}]
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/images/7phone-logo.svg']
    }
  };
}

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const t = await getTranslations();
  const [settings, categories, brands, products, homepageSections] = await Promise.all([
    getSettings(),
    getCategories(),
    getBrands(),
    getProducts(),
    getHomepageSections()
  ]);
  const catalogControl = (type: 'categories' | 'brands') => homepageSections
    .map((section) => ({section, config: configOf(section)}))
    .find(({section, config}) => config?.type === type && activeHomepageConfig(section, config));
  const applyControl = <T extends {id: string | number}>(items: T[], type: 'categories' | 'brands') => {
    const control = catalogControl(type); if (!control?.config) return items;
    const hidden = new Set((control.config.hidden_item_ids ?? []).map(String));
    const orderedIds = control.config.item_ids?.map(String) ?? [];
    const knownIds = new Set(orderedIds);
    const order = orderedIds.length
      ? [...orderedIds, ...items.map((item) => String(item.id)).filter((itemId) => !knownIds.has(itemId))]
      : items.map((item) => String(item.id));
    return order.map((itemId) => items.find((item) => String(item.id) === itemId)).filter((item): item is T => Boolean(item)).filter((item) => !hidden.has(String(item.id))).map((item, index) => {
      const override = control.config?.item_overrides?.[String(item.id)] ?? {};
      return {...item, name_ar: override.name_ar || (item as any).name_ar, name_en: override.name_en || (item as any).name_en, homepage_url: override.url || undefined, ...(type === 'categories' ? {icon: override.icon || (item as any).icon, display_order: index, sort_order: index} : {logo_url: override.logo_url || (item as any).logo_url, sort_order: index})};
    });
  };
  const categoryControl = catalogControl('categories');
  const brandControl = catalogControl('brands');

  return (
    <div className="storefront-shell min-h-screen bg-[#f5f5f7] text-[#111111]">
      <Header locale={locale} settings={settings} />
      <PublishedHomepageBanners locale={locale} placement="hero" sections={homepageSections} />
      {!managedHomepageHeroExists(homepageSections) ? <Hero locale={locale} products={products} settings={settings} /> : null}
      <PublishedHomepageBanners locale={locale} placement="secondary" sections={homepageSections} />
      <SearchCatalog
        locale={locale}
        products={products}
        brands={applyControl(brands, 'brands')}
        categories={applyControl(categories, 'categories')}
        categoryTitleAr={categoryControl?.section.title_ar}
        categoryTitleEn={categoryControl?.section.title_en}
        brandTitleAr={brandControl?.section.title_ar}
        brandTitleEn={brandControl?.section.title_en}
        settings={settings}
        labels={{
          all: t('all'),
          order: locale === 'ar' ? 'اشتر الآن' : 'Buy Now'
        }}
      />
      <TrustAndSocialSections locale={locale} />
      <Footer settings={settings} />
    </div>
  );
}
