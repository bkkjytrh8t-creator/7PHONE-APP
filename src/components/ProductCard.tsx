import {brandName, categoryName, formatPrice, localizedProductList, localizedProductText, productName, productRamValues} from '@/lib/format';
import {primaryProductImage} from '@/lib/productNormalize';
import {productAvailabilityLabel, productIsOutOfStock} from '@/lib/stock';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {whatsappNotifyWhenAvailableUrl} from '@/lib/whatsapp';
import {FallbackImage} from './FallbackImage';
import {ProductLikeButton} from './ProductLikeButton';
import {ProductQuickViewButton} from './ProductQuickViewButton';
import {ProductStats} from './ProductStats';
import {WhatsAppButton} from './WhatsAppButton';

export function ProductCard({
  product,
  locale,
  settings,
  orderLabel
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
  orderLabel: string;
}) {
  const name = productName(product, locale);
  const image = primaryProductImage(product);
  const productHref = `/${locale}/product/${product.id}`;
  const isOutOfStock = productIsOutOfStock(product);
  const stockLabel = productAvailabilityLabel(product, locale);
  const warranty = localizedProductText(product, 'warranty', locale);
  const storage = localizedProductList(product, 'storage', locale);
  const ram = productRamValues(product);
  const specs = [
    storage.length ? storage.join(' / ') : '',
    ram.length ? `${locale === 'ar' ? 'رام' : 'RAM'} ${ram.join(' / ')}` : ''
  ].filter(Boolean).join(' · ');
  const purchaseLabel = locale === 'ar' ? 'اشترِ الآن' : 'Buy Now';

  return (
    <article className="product-card group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]">
      <div className="relative">
        <ProductQuickViewButton
          product={product}
          locale={locale}
          settings={settings}
          label={locale === 'ar' ? 'عرض سريع' : 'Quick View'}
          orderLabel={orderLabel}
          className="block w-full text-start"
        >
          <div className="relative grid aspect-square place-items-center bg-[#f5f5f7] p-4">
          <FallbackImage alt={name} className="h-full w-full rounded-2xl object-contain transition duration-300 group-hover:scale-[1.02]" src={image}>
            <div className="grid h-full w-full place-items-center rounded-2xl bg-[#f2f2f3] text-center text-xs font-bold leading-5 text-[#111111]">
              <span>
                <span className="mx-auto mb-3 block h-20 w-20 rounded-[24px] border border-brand-neon/40 bg-gradient-to-br from-white/20 via-black to-brand-neon/30" />
                {name}
              </span>
            </div>
          </FallbackImage>
          {product.badge !== 'none' && (
            <span className="absolute start-2.5 top-2.5 rounded-md bg-brand-neon px-2 py-1 text-[10px] font-black uppercase text-white">
              {product.badge.replace('-', ' ')}
            </span>
          )}
          <span className={`absolute bottom-2.5 start-2.5 rounded-full px-2 py-1 text-[10px] font-black ${!isOutOfStock ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
            {stockLabel}
          </span>
          </div>
        </ProductQuickViewButton>
        <ProductLikeButton
          productId={product.id}
          initialLikes={product.likes}
          label={locale === 'ar' ? 'إعجاب بالمنتج' : 'Like product'}
        />
      </div>
      <a href={productHref} className="block">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase text-[#888888]">
            <span>{brandName(product, locale)}</span>
            <span>{categoryName(product, locale)}</span>
          </div>
          <h2 className="min-h-10 break-words text-sm font-black leading-5 text-[#111111] md:text-[15px]">{name}</h2>
          <ProductStats product={product} locale={locale} compact />
          {specs ? <p className="text-[11px] font-bold text-[#666666]">{specs}</p> : null}
          <p className="text-[11px] font-bold text-[#666666]">{warranty}</p>
          <div className="flex items-end gap-2">
            <strong className="text-lg font-black text-brand-neon">{formatPrice(product.price_bhd, locale)}</strong>
            {product.old_price_bhd ? (
              <span className="pb-0.5 text-xs font-semibold text-zinc-400 line-through">
                {formatPrice(product.old_price_bhd, locale)}
              </span>
            ) : null}
          </div>
        </div>
      </a>
      <div className="product-card-actions mt-auto px-5 pb-5">
        <div className="product-card-action-secondary">
          <ProductQuickViewButton
            product={product}
            locale={locale}
            settings={settings}
            label={locale === 'ar' ? 'عرض سريع' : 'Quick View'}
            orderLabel={purchaseLabel}
          />
        </div>
        <div className="product-card-action-primary">
          <WhatsAppButton cardPurchase product={product} locale={locale} settings={settings} label={purchaseLabel} />
        </div>
        {isOutOfStock ? (
          <a className="product-card-stock-action grid h-10 place-items-center rounded-xl bg-white/10 px-3 text-center text-xs font-black text-white" href={whatsappNotifyWhenAvailableUrl(product, locale, settings)} target="_blank" rel="noreferrer">
            {locale === 'ar' ? 'أبلغني عند توفر المنتج' : 'Notify Me When Available'}
          </a>
        ) : null}
      </div>
    </article>
  );
}
