import {formatPrice, productName} from './format';
import type {Locale, Product, StoreSettings} from './types';

const publicSiteUrl = 'https://7phone.app';
const orderWhatsappNumber = '39011777';

export type WhatsAppOrderDetails = {
  customerName: string;
  customerPhone: string;
  storage: string;
  color: string;
  quantity: number;
  deliveryOption: 'pickup' | 'delivery';
  notes: string;
  productUrl?: string;
};

function deliveryLabel(deliveryOption: WhatsAppOrderDetails['deliveryOption'], locale: Locale) {
  if (deliveryOption === 'pickup') {
    return locale === 'ar' ? 'استلام من المحل' : 'Pickup from store';
  }

  return locale === 'ar' ? 'توصيل' : 'Delivery';
}

export function productPageUrl(product: Product, locale: Locale) {
  return `${publicSiteUrl}/${locale}/product/${product.id}`;
}

export function whatsappOrderUrl(
  product: Product,
  locale: Locale,
  _settings: StoreSettings,
  details?: WhatsAppOrderDetails
) {
  const selectedStorage = details?.storage || (locale === 'ar' ? 'غير محدد' : 'Not selected');
  const selectedColor = details?.color || (locale === 'ar' ? 'غير محدد' : 'Not selected');
  const productUrl = details?.productUrl || productPageUrl(product, locale);
  const message = details
    ? locale === 'ar'
      ? [
          'طلب جديد من 7Phone',
          `المنتج: ${productName(product, locale)}`,
          `السعر: ${formatPrice(product.price_bhd, locale)}`,
          `السعة: ${selectedStorage}`,
          `اللون: ${selectedColor}`,
          `الكمية: ${details.quantity}`,
          `اسم العميل: ${details.customerName}`,
          `هاتف العميل: ${details.customerPhone}`,
          `طريقة الاستلام: ${deliveryLabel(details.deliveryOption, locale)}`,
          `ملاحظات: ${details.notes || 'لا يوجد'}`,
          `رابط المنتج: ${productUrl}`
        ].join('\n')
      : [
          'New order from 7Phone',
          `Product: ${productName(product, locale)}`,
          `Price: ${formatPrice(product.price_bhd, locale)}`,
          `Storage: ${selectedStorage}`,
          `Color: ${selectedColor}`,
          `Quantity: ${details.quantity}`,
          `Customer name: ${details.customerName}`,
          `Customer phone: ${details.customerPhone}`,
          `Delivery option: ${deliveryLabel(details.deliveryOption, locale)}`,
          `Notes: ${details.notes || 'None'}`,
          `Product page: ${productUrl}`
        ].join('\n')
    : locale === 'ar'
      ? `مرحباً، أنا مهتم بهذا المنتج من 7phone:\n${productName(product, locale)} — ${formatPrice(product.price_bhd, locale)}\n${productUrl}`
      : `Hi, I'm interested in this product from 7phone:\n${productName(product, locale)} — ${formatPrice(product.price_bhd, locale)}\n${productUrl}`;

  return `https://wa.me/${orderWhatsappNumber}?text=${encodeURIComponent(message)}`;
}
