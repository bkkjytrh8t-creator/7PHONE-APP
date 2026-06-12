'use client';

import {useEffect, useMemo, useState} from 'react';
import {brandName, categoryName, formatPrice, productName} from '@/lib/format';
import type {Category, Locale, Product, StoreSettings} from '@/lib/types';
import {BrandBar} from './BrandBar';
import {CategoryBar} from './CategoryBar';
import {OfferCountdown} from './OfferCountdown';
import {ProductCard} from './ProductCard';

export function SearchCatalog({
  locale,
  products,
  categories,
  settings,
  labels
}: {
  locale: Locale;
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  labels: {
    all: string;
    search: string;
    order: string;
    offers: string;
    newArrivals: string;
    bestSellers: string;
  };
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const catalogProducts = useMemo(() => {
    const localIds = new Set(localProducts.map((product) => product.id));
    return [...localProducts, ...products.filter((product) => !localIds.has(product.id))];
  }, [localProducts, products]);

  useEffect(() => {
    function loadLocalProducts() {
      try {
        const saved = window.localStorage.getItem('7phone-local-products');
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

  const priceLimits = useMemo(() => {
    const prices = catalogProducts.map((product) => product.price_bhd);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    };
  }, [catalogProducts]);
  const [minPrice, setMinPrice] = useState(priceLimits.min);
  const [maxPrice, setMaxPrice] = useState(priceLimits.max);

  function updateMinPrice(value: number) {
    setMinPrice(Math.min(value, maxPrice));
  }

  function updateMaxPrice(value: number) {
    setMaxPrice(Math.max(value, minPrice));
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return catalogProducts.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category.slug === activeCategory;
      const matchesBrand = activeBrand === 'all' || product.brand.name_en === activeBrand;
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
  }, [activeBrand, activeCategory, catalogProducts, locale, maxPrice, minPrice, query]);

  const promoProducts = catalogProducts.filter((product) => product.badge !== 'none');
  const featuredOffer = promoProducts[0] ?? catalogProducts[0];
  const latestProducts = [...filteredProducts].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const mostViewed = [...filteredProducts].sort((a, b) => b.views - a.views);
  const mostLiked = [...filteredProducts].sort((a, b) => b.likes - a.likes);
  const mostOrdered = [...filteredProducts].sort((a, b) => b.orders - a.orders);
  const mostShared = [...filteredProducts].sort((a, b) => b.shares - a.shares);
  const visibleBrands = useMemo(() => {
    const brandMap = new Map<number, Product['brand']>();
    catalogProducts.forEach((product) => {
      brandMap.set(product.brand.id, product.brand);
    });
    return Array.from(brandMap.values());
  }, [catalogProducts]);

  return (
    <>
      <section className="border-b border-white/10 bg-black px-4 py-3">
        <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,460px)] lg:items-center">
          <label className="relative block">
            <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
              ⌕
            </span>
            <input
              className="h-11 w-full rounded-full border border-white/10 bg-white/8 ps-10 pe-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/40 focus:border-brand-neon focus:bg-black focus:shadow-[0_0_0_3px_rgba(255,0,140,0.16)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
              type="search"
              value={query}
            />
          </label>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
            <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex items-center gap-2 whitespace-nowrap text-xs font-black text-white">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-black text-brand-neon">
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
                  className="h-8 w-20 rounded-full border border-white/10 bg-black px-3 text-center text-xs font-black text-white outline-none focus:border-brand-neon"
                  max={maxPrice}
                  min={priceLimits.min}
                  onChange={(event) => updateMinPrice(Number(event.target.value))}
                  type="number"
                  value={minPrice}
                />
                <input
                  aria-label={locale === 'ar' ? 'أعلى سعر' : 'Maximum price'}
                  className="h-8 w-20 rounded-full border border-white/10 bg-black px-3 text-center text-xs font-black text-white outline-none focus:border-brand-neon"
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

      <CategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        locale={locale}
        allLabel={labels.all}
      />

      <BrandBar
        brands={visibleBrands}
        activeBrand={activeBrand}
        onSelect={setActiveBrand}
        locale={locale}
        allLabel={locale === 'ar' ? 'كل الماركات' : 'All brands'}
      />

      <section className="bg-[#050505] px-4 py-5 text-white">
        {featuredOffer ? (
          <div className="mx-auto mb-5 max-w-7xl">
            <OfferCountdown
              locale={locale}
              productName={productName(featuredOffer, locale)}
              priceText={formatPrice(featuredOffer.price_bhd, locale)}
            />
          </div>
        ) : null}
        <div className="hide-scrollbar mx-auto flex max-w-7xl gap-3 overflow-x-auto">
          {[labels.offers, labels.newArrivals, labels.bestSellers].map((label, index) => (
            <div
              className="min-w-72 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-sm"
              key={label}
            >
              <div className="text-xs font-black text-brand-neon">{label}</div>
              <div className="mt-2 text-lg font-black">
                {promoProducts[index % Math.max(promoProducts.length, 1)]?.name_en ?? '7phone'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-6">
        {[
          ['أحدث المنتجات', latestProducts],
          ['الأكثر مشاهدة', mostViewed],
          ['الأكثر إعجاباً', mostLiked],
          ['الأكثر طلباً', mostOrdered],
          ['الأكثر مشاركة', mostShared]
        ].map(([title, list]) => (
          <section key={title as string}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">{title as string}</h2>
              <span className="text-xs font-bold text-white/40">{(list as Product[]).length} منتج</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {(list as Product[]).slice(0, 5).map((product) => (
                <ProductCard
                  key={`${title}-${product.id}`}
                  product={product}
                  locale={locale}
                  settings={settings}
                  orderLabel={labels.order}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
