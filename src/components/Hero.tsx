import type {Locale, Product, StoreSettings} from '@/lib/types';
import {heroProductImage} from '@/lib/productNormalize';
import {HeroSlider, type HeroSlide} from './HeroSlider';

function slideProducts(products: Product[]) {
  const active = products.filter((product) => {
    const searchable = `${product.name_en} ${product.name_ar}`.toLowerCase();
    const isTestContent = /\b(demo|test|testing|placeholder)\b/i.test(searchable);
    return product.is_active !== false && product.stock_status !== 'deleted' && !isTestContent;
  });
  const scored = [...active].sort((a, b) => {
    const score = (product: Product) => {
      const record = product as Product & {is_offer?: boolean; is_new?: boolean; is_featured?: boolean};
      return Number(Boolean(record.is_offer || product.badge === 'deal')) * 4
        + Number(Boolean(record.is_new || product.badge === 'new')) * 3
        + Number(Boolean(record.is_featured || product.badge === 'best-seller')) * 2;
    };
    return score(b) - score(a) || Date.parse(b.created_at) - Date.parse(a.created_at);
  });
  return scored.filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index).slice(0, 5);
}

export function Hero({settings, products, locale}: {settings: StoreSettings; products: Product[]; locale: Locale}) {
  const selected = slideProducts(products);
  const slides: HeroSlide[] = selected.map((product, index) => ({
    id: String(product.id),
    desktopImage: heroProductImage(product),
    mobileImage: heroProductImage(product),
    titleAr: product.name_ar,
    titleEn: product.name_en,
    subtitleAr: product.short_description_ar || product.description_ar,
    subtitleEn: product.short_description_en || product.description_en,
    oldPrice: product.old_price_bhd ?? null,
    price: product.price_bhd,
    ctaAr: 'تسوق الآن',
    ctaEn: 'Shop Now',
    href: `/${locale}/product/${product.id}`,
    enabled: true,
    displayOrder: index
  }));

  if (slides.length < 3) {
    slides.push({
      id: 'store-banner',
      desktopImage: settings.bannerUrl || '/images/7phone-hero.png',
      mobileImage: settings.bannerUrl || '/images/7phone-hero.png',
      titleAr: 'عروض 7Phone',
      titleEn: '7Phone Offers',
      subtitleAr: 'اكتشف أحدث الهواتف والإكسسوارات والعروض.',
      subtitleEn: 'Discover the latest phones, accessories, and offers.',
      oldPrice: null,
      price: null,
      ctaAr: 'تسوق الآن',
      ctaEn: 'Shop Now',
      href: `/${locale}#products`,
      enabled: true,
      displayOrder: slides.length
    });
  }

  return <HeroSlider locale={locale} slides={slides} />;
}
