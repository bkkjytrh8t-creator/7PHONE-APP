import Link from 'next/link';
import {brandName, categoryName, formatPrice, productName} from '@/lib/format';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {ProductLikeButton} from './ProductLikeButton';
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
  const image = product.images[0];

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-sm transition hover:-translate-y-0.5 hover:border-brand-neon/60 hover:shadow-neon">
      <div className="relative">
        <Link href={`/${locale}/product/${product.id}`} className="block">
          <div className="relative grid aspect-square place-items-center bg-[#111115] p-3">
          {image ? (
            <img alt={name} className="h-full w-full rounded-xl object-cover" src={image} />
          ) : (
            <div className="grid h-full w-full place-items-center rounded-xl bg-black text-center text-xs font-bold leading-5 text-white">
              <span>
                <span className="mx-auto mb-3 block h-20 w-20 rounded-[24px] border border-brand-neon/40 bg-gradient-to-br from-white/20 via-black to-brand-neon/30" />
                {name}
              </span>
            </div>
          )}
          {product.badge !== 'none' && (
            <span className="absolute start-2.5 top-2.5 rounded-md bg-brand-neon px-2 py-1 text-[10px] font-black uppercase text-white">
              {product.badge.replace('-', ' ')}
            </span>
          )}
          <span className={`absolute bottom-2.5 start-2.5 rounded-full px-2 py-1 text-[10px] font-black ${product.stock_status === 'available' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
            {product.stock_status === 'available' ? 'متوفر الآن' : 'نفذ من المخزون'}
          </span>
          </div>
        </Link>
        <ProductLikeButton
          productId={product.id}
          initialLikes={product.likes}
          label={locale === 'ar' ? 'إعجاب بالمنتج' : 'Like product'}
        />
      </div>
      <Link href={`/${locale}/product/${product.id}`} className="block">
        <div className="space-y-2.5 p-3.5">
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase text-white/40">
            <span>{brandName(product, locale)}</span>
            <span>{categoryName(product, locale)}</span>
          </div>
          <h2 className="min-h-10 text-sm font-black leading-5 text-white">{name}</h2>
          <ProductStats product={product} locale={locale} compact />
          <p className="text-[11px] font-bold text-white/55">{product.warranty}</p>
          <div className="flex items-end gap-2">
            <strong className="text-lg font-black text-brand-neon">{formatPrice(product.price_bhd, locale)}</strong>
            {product.old_price_bhd ? (
              <span className="pb-0.5 text-xs font-semibold text-zinc-400 line-through">
                {formatPrice(product.old_price_bhd, locale)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-2 px-3.5 pb-3.5">
        <Link className="grid h-10 place-items-center rounded-xl border border-white/10 text-xs font-black text-white hover:border-brand-neon" href={`/${locale}/product/${product.id}`}>
          عرض سريع
        </Link>
        {product.stock_status === 'available' ? (
          <WhatsAppButton product={product} locale={locale} settings={settings} label={orderLabel} />
        ) : (
          <a className="grid h-10 place-items-center rounded-xl bg-white/10 text-xs font-black text-white" href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`أبلغني عند توفر ${name}`)}`}>
            أبلغني
          </a>
        )}
      </div>
    </article>
  );
}
