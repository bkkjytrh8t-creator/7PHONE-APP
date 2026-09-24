'use client';

import {useEffect, useMemo, useState} from 'react';
import {brandName, categoryName, formatPrice, productName} from '@/lib/format';
import {normalizeProducts} from '@/lib/productNormalize';
import type {Brand, Category, Locale, Product, StoreSettings} from '@/lib/types';
import {CategoryBar} from './CategoryBar';
import {ProductCard} from './ProductCard';

const shopCategories: Category[] = [
  {id: 1, slug: 'phones', name_en: 'Phones', name_ar: 'الهواتف', icon: 'phones', sort_order: 1},
  {id: 2, slug: 'tablets', name_en: 'Tablets', name_ar: 'الأجهزة اللوحية', icon: 'tablets', sort_order: 2},
  {id: 3, slug: 'covers', name_en: 'Covers', name_ar: 'الكفرات', icon: 'covers', sort_order: 3},
  {id: 4, slug: 'earphones', name_en: 'Earphones', name_ar: 'السماعات', icon: 'earphones', sort_order: 4},
  {id: 5, slug: 'wall-chargers', name_en: 'Wall Chargers', name_ar: 'شواحن الجدار', icon: 'wall-chargers', sort_order: 5},
  {id: 6, slug: 'car-chargers', name_en: 'Car Chargers', name_ar: 'شواحن السيارة', icon: 'car-chargers', sort_order: 6},
  {id: 7, slug: 'power-banks', name_en: 'Power Banks', name_ar: 'باور بانك', icon: 'power-banks', sort_order: 7},
  {id: 8, slug: 'cables', name_en: 'Cables', name_ar: 'الكيابل', icon: 'cables', sort_order: 8},
  {id: 9, slug: 'smart-watches', name_en: 'Smart Watches', name_ar: 'الساعات الذكية', icon: 'smart-watches', sort_order: 9}
];

const categoryAliases: Record<string, string[]> = {
  phones: ['phones', 'phone', 'mobiles', 'mobile', 'smartphones', 'smartphone'],
  tablets: ['tablets', 'tablet', 'ipads', 'ipad'],
  covers: ['covers', 'cover', 'cases', 'case', 'protection'],
  earphones: ['earphones', 'earphone', 'earbuds', 'earbud', 'headphones', 'headphone', 'audio'],
  'wall-chargers': ['wall-chargers', 'wall-charger', 'chargers', 'charger', 'adapters', 'adapter'],
  'car-chargers': ['car-chargers', 'car-charger'],
  'power-banks': ['power-banks', 'power-bank', 'powerbanks', 'powerbank'],
  cables: ['cables', 'cable', 'usb-cables'],
  'smart-watches': ['smart-watches', 'smart-watch', 'watches', 'watch']
};

const categoryKeywords: Record<string, string[]> = {
  phones: ['phone', 'mobile', 'iphone', 'galaxy', 'honor', 'xiaomi', 'oppo', 'vivo', 'huawei', 'tecno', 'هاتف', 'جوال', 'ايفون', 'آيفون', 'جالكسي'],
  tablets: ['tablet', 'ipad', 'tab', 'تابلت', 'آيباد', 'ايباد', 'لوحي'],
  covers: ['cover', 'case', 'clear case', 'كفر', 'غطاء', 'جراب', 'حماية'],
  earphones: ['earphone', 'earphones', 'earbud', 'earbuds', 'headphone', 'headphones', 'airpods', 'سماعة', 'سماعات', 'ايربودز'],
  'wall-chargers': ['wall charger', 'adapter', 'power adapter', 'travel charger', 'شاحن جداري', 'شاحن جدار', 'فيش', 'محول'],
  'car-chargers': ['car charger', 'car adapter', 'سيارة', 'شاحن سيارة'],
  'power-banks': ['power bank', 'powerbank', 'battery pack', 'باور بانك', 'باوربنك', 'بنك طاقة'],
  cables: ['cable', 'usb', 'type-c', 'type c', 'lightning', 'كيبل', 'كابل', 'سلك', 'يو اس بي'],
  'smart-watches': ['smart watch', 'watch', 'apple watch', 'ساعة', 'ساعات', 'ساعة ذكية']
};

function categoryKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryMatchesCanonical(category: Category, canonical: Category) {
  const aliases = new Set([canonical.slug, ...(categoryAliases[canonical.slug] ?? [])]);
  const keys = [
    category.slug,
    category.name_en,
    category.name_ar,
    category.icon
  ].map((value) => categoryKey(value));

  return keys.some((key) => aliases.has(key));
}

function categoryIsHidden(category: Category) {
  return category.is_visible === false || category.is_active === false;
}

function buildShopCategories(categories: Category[]): Category[] {
  return shopCategories
    .map((fallback): Category | null => {
      const match = categories.find((category) => categoryMatchesCanonical(category, fallback));

      if (match && categoryIsHidden(match)) {
        return null;
      }

      return {
        ...fallback,
        ...(match ?? {}),
        id: match?.id ?? fallback.id,
        slug: fallback.slug,
        icon: match?.icon?.trim() || fallback.icon,
        sort_order: match?.sort_order ?? fallback.sort_order,
        display_order: match?.display_order ?? match?.sort_order ?? fallback.sort_order,
        is_active: match?.is_active ?? fallback.is_active,
        is_visible: match?.is_visible ?? fallback.is_visible
      };
    })
    .filter((category): category is Category => Boolean(category))
    .sort((a, b) => (a.display_order ?? a.sort_order ?? 0) - (b.display_order ?? b.sort_order ?? 0));
}

function normalizedText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => normalizedText(item)).join(' ');
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map((item) => normalizedText(item)).join(' ');
  }

  return String(value ?? '').toLowerCase();
}

function productMatchesShopCategory(product: Product, categorySlug: string, locale: Locale) {
  const keywords = categoryKeywords[categorySlug] ?? [categorySlug];
  const record = product as Product & Record<string, unknown>;
  const haystack = [
    product.category.slug,
    product.category.name_en,
    product.category.name_ar,
    product.name_en,
    product.name_ar,
    product.description_en,
    product.description_ar,
    product.short_description_en,
    product.short_description_ar,
    productName(product, locale),
    categoryName(product, locale),
    normalizedText(record.tags),
    normalizedText(record.features),
    normalizedText(record.data)
  ].join(' ').toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function SearchCatalog({
  locale,
  products,
  brands,
  categories,
  settings,
  labels,
  categoryTitleAr, categoryTitleEn, brandTitleAr, brandTitleEn
}: {
  locale: Locale;
  products: Product[];
  brands: Brand[];
  categories: Category[];
  settings: StoreSettings;
  labels: {
    all: string;
    order: string;
  };
  categoryTitleAr?: string; categoryTitleEn?: string; brandTitleAr?: string; brandTitleEn?: string;
}) {
  const allFilter = 'all';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState(allFilter);
  const catalogProducts = useMemo(() => {
    return normalizeProducts(products).filter((product) => {
      const searchable = `${product.name_en} ${product.name_ar}`.toLowerCase();
      return !/\b(demo|test|testing|placeholder)\b/i.test(searchable);
    });
  }, [products]);
  const homepageCategories = useMemo(() => buildShopCategories(categories), [categories]);

  const priceLimits = useMemo(() => {
    const prices = catalogProducts.map((product) => product.price_bhd);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    };
  }, [catalogProducts]);
  const [minPrice, setMinPrice] = useState(priceLimits.min);
  const [maxPrice, setMaxPrice] = useState(priceLimits.max);

  useEffect(() => {
    setMinPrice((value) => {
      if (!catalogProducts.length) return value;
      if (value === 0 && priceLimits.min > 0) return priceLimits.min;
      return Math.min(Math.max(value, priceLimits.min), priceLimits.max);
    });
    setMaxPrice((value) => {
      if (!catalogProducts.length) return value;
      if (value === 0 && priceLimits.max > 0) return priceLimits.max;
      return Math.min(Math.max(value, priceLimits.min), priceLimits.max);
    });
  }, [catalogProducts.length, priceLimits.max, priceLimits.min]);

  function updateMinPrice(value: number) {
    setMinPrice(Math.min(value, maxPrice));
  }

  function updateMaxPrice(value: number) {
    setMaxPrice(Math.max(value, minPrice));
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const hasCategoryFilter = Boolean(activeCategory);

    return catalogProducts.filter((product) => {
      const matchesCategory =
        !hasCategoryFilter || productMatchesShopCategory(product, activeCategory ?? '', locale);
      const matchesBrand = activeBrand === allFilter || product.brand.name_en.toLowerCase().replace(/[^a-z0-9]/g, '') === activeBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchesPrice = product.price_bhd >= minPrice && product.price_bhd <= maxPrice;

      const haystack = [
        productName(product, locale),
        brandName(product, locale),
        categoryName(product, locale),
        product.storage.join(' '),
        formatPrice(product.price_bhd, locale),
        String(product.price_bhd)
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && matchesBrand && matchesPrice && (!normalized || haystack.includes(normalized));
    });
  }, [activeBrand, activeCategory, allFilter, catalogProducts, locale, maxPrice, minPrice, query]);

  const hasActiveFilters =
    Boolean(activeCategory)
    || activeBrand !== allFilter
    || Boolean(query.trim())
    || minPrice !== priceLimits.min
    || maxPrice !== priceLimits.max;
  const emptyStateText = hasActiveFilters
    ? locale === 'ar'
      ? 'لا توجد منتجات مطابقة حالياً. جرّب اختيار الكل أو تغيير الفلتر.'
      : 'No matching products right now. Try All or adjust the filter.'
    : locale === 'ar'
      ? 'لا توجد منتجات متاحة حالياً.'
      : 'No products available right now.';

  function selectCategory(slug: string) {
    setActiveCategory(slug === allFilter ? null : slug);
  }

  function selectBrand(brand: string) {
    setActiveBrand(brand);
  }

  return (
    <>
      <CategoryBar
        categories={homepageCategories}
        activeCategory={activeCategory ?? allFilter}
        onSelect={selectCategory}
        locale={locale}
        allLabel={labels.all}
        title={locale === 'ar' ? categoryTitleAr : categoryTitleEn}
      />

      <section className="bg-[#f5f5f7] px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(320px,1fr)_minmax(420px,520px)] lg:items-center">
          <label className="relative block">
            <span className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 text-base text-zinc-400">
              ⌕
            </span>
            <input
              className="h-[52px] w-full rounded-[20px] border border-[#ececec] bg-white ps-12 pe-5 text-sm font-semibold text-[#111111] shadow-[0_8px_30px_rgba(0,0,0,0.05)] outline-none transition duration-200 placeholder:text-[#999999] hover:border-[#cfcfcf] focus:border-brand-neon focus:shadow-[0_0_0_3px_rgba(255,0,140,0.10)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === 'ar' ? 'ابحث عن جهاز، ماركة أو سعر' : 'Search devices, brands or prices'}
              type="search"
              value={query}
            />
          </label>
          <div className="rounded-[20px] border border-[#ececec] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex items-center gap-2 whitespace-nowrap text-xs font-black text-[#111111]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f7f7f8] text-[10px] text-brand-neon">
                  BHD
                </span>
                <span>{locale === 'ar' ? 'الميزانية' : 'Budget'}</span>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <input
                    aria-label={locale === 'ar' ? 'أقل سعر' : 'Minimum price'}
                    className="h-5 w-full accent-brand-neon"
                    max={priceLimits.max}
                    min={priceLimits.min}
                    onChange={(event) => updateMinPrice(Number(event.target.value))}
                    step="1"
                    type="range"
                    value={minPrice}
                  />
                  <input
                    aria-label={locale === 'ar' ? 'أعلى سعر' : 'Maximum price'}
                    className="h-5 w-full accent-brand-neon"
                    max={priceLimits.max}
                    min={priceLimits.min}
                    onChange={(event) => updateMaxPrice(Number(event.target.value))}
                    step="1"
                    type="range"
                    value={maxPrice}
                  />
                </div>
                <div className="flex justify-between px-1 text-[11px] font-bold text-zinc-400">
                  <span>{formatPrice(priceLimits.min, locale)}</span>
                  <span>{formatPrice(priceLimits.max, locale)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input
                  aria-label={locale === 'ar' ? 'أقل سعر' : 'Minimum price'}
                  className="h-8 w-20 rounded-full border border-[#dedede] bg-white px-3 text-center text-xs font-black text-[#111111] outline-none focus:border-brand-neon"
                  max={maxPrice}
                  min={priceLimits.min}
                  onChange={(event) => updateMinPrice(Number(event.target.value))}
                  type="number"
                  value={minPrice}
                />
                <input
                  aria-label={locale === 'ar' ? 'أعلى سعر' : 'Maximum price'}
                  className="h-8 w-20 rounded-full border border-[#dedede] bg-white px-3 text-center text-xs font-black text-[#111111] outline-none focus:border-brand-neon"
                  max={priceLimits.max}
                  min={minPrice}
                  onChange={(event) => updateMaxPrice(Number(event.target.value))}
                  type="number"
                  value={maxPrice}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl scroll-mt-4 gap-8 bg-[#f5f5f7] px-4 py-16" id="products">
        <section aria-labelledby="all-products-title">
          <div className="mb-8 flex items-center justify-between gap-3 border-b border-[#ececec] pb-4">
            <h2 className="text-2xl font-black tracking-tight text-[#111111] md:text-3xl" id="all-products-title">
              {locale === 'ar' ? 'جميع المنتجات' : 'All Products'}
            </h2>
            <span className="text-xs font-bold text-[#777777]">
              {filteredProducts.length} {locale === 'ar' ? 'منتج' : 'products'}
            </span>
          </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#ececec] bg-[#f7f7f8] px-4 py-8 text-center text-sm font-bold text-[#666666]">
            {emptyStateText}
          </div>
        ) : null}

        {filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  settings={settings}
                  orderLabel={labels.order}
                />
              ))}
            </div>
        ) : null}
        </section>
      </main>
    </>
  );
}
