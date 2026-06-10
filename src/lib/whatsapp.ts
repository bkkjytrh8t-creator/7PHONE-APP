import {formatPrice, productName} from './format';
import type {Locale, Product, StoreSettings} from './types';

const publicSiteUrl = 'https://7phone.app';

export function whatsappOrderUrl(product: Product, locale: Locale, settings: StoreSettings) {
  const productUrl = `${publicSiteUrl}/${locale}/product/${product.id}`;
  const message =
    locale === 'ar'
      ? `مرحباً، أنا مهتم بهذا المنتج من 7phone:\n${productName(product, locale)} — ${formatPrice(product.price_bhd, locale)}\n${productUrl}`
      : `Hi, I'm interested in this product from 7phone:\n${productName(product, locale)} — ${formatPrice(product.price_bhd, locale)}\n${productUrl}`;

  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;
}
