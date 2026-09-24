import {formatPrice, productName} from './format';
import {calculateOrderTotals, formatOrderAmount} from './orderTotals';
import type {Locale, Product, StoreSettings} from './types';

const publicSiteUrl = 'https://7phone.app';
const defaultBahrainWhatsappNumber = '97339011777';

export type WhatsAppOrderDetails = {
  customerName: string;
  customerPhone: string;
  storage: string;
  color: string;
  ram?: string;
  sku?: string;
  quantity: number;
  deliveryOption: 'pickup' | 'delivery';
  paymentMethod: 'benefit' | 'cash';
  unitPrice: number;
  receiptFileName?: string;
  notes: string;
  address?: {
    area: string;
    block: string;
    road: string;
    building: string;
    flat?: string;
    notes?: string;
    locationUrl?: string;
  };
  productUrl?: string;
};

function deliveryLabel(deliveryOption: WhatsAppOrderDetails['deliveryOption'], locale: Locale) {
  if (deliveryOption === 'pickup') {
    return locale === 'ar' ? 'استلام من المحل' : 'Pickup from store';
  }

  return locale === 'ar' ? 'توصيل' : 'Delivery';
}

export function normalizeBahrainWhatsappNumber(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : '';

  if (!raw) {
    return defaultBahrainWhatsappNumber;
  }

  const compact = raw.replace(/[\s()-]/g, '');
  const digits = compact.replace(/\D/g, '');

  if (compact.startsWith('+')) {
    if (digits === defaultBahrainWhatsappNumber) {
      return defaultBahrainWhatsappNumber;
    }

    return defaultBahrainWhatsappNumber;
  }

  if (digits === defaultBahrainWhatsappNumber || digits === `00${defaultBahrainWhatsappNumber}`) {
    return defaultBahrainWhatsappNumber;
  }

  if (digits === defaultBahrainWhatsappNumber.slice(3)) {
    return defaultBahrainWhatsappNumber;
  }

  return defaultBahrainWhatsappNumber;
}

export function whatsappMessageUrl(phone: unknown, message: string) {
  const normalizedPhone = normalizeBahrainWhatsappNumber(phone);
  return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
}

export function productPageUrl(product: Product, locale: Locale) {
  return `${publicSiteUrl}/${locale}/product/${product.id}`;
}

export function whatsappOrderUrl(
  product: Product,
  locale: Locale,
  settings: StoreSettings,
  details?: WhatsAppOrderDetails
) {
  const selectedStorage = details?.storage || (locale === 'ar' ? 'غير محدد' : 'Not selected');
  const selectedColor = details?.color || (locale === 'ar' ? 'غير محدد' : 'Not selected');
  const productUrl = details?.productUrl || productPageUrl(product, locale);
  const totals = details ? calculateOrderTotals({
    unitPrice: details.unitPrice,
    quantity: details.quantity,
    fulfillment: details.deliveryOption
  }) : null;
  const address = details?.deliveryOption === 'delivery' ? details.address : undefined;
  const arabicAddressLines = address ? [
    `المنطقة: ${address.area}`,
    `المجمع: ${address.block}`,
    `الطريق: ${address.road}`,
    `المبنى / المنزل: ${address.building}`,
    ...(address.flat ? [`الشقة: ${address.flat}`] : []),
    ...(address.notes ? [`ملاحظات العنوان: ${address.notes}`] : []),
    ...(address.locationUrl ? [`رابط الموقع: ${address.locationUrl}`] : [])
  ] : [];
  const englishAddressLines = address ? [
    `Area: ${address.area}`,
    `Block: ${address.block}`,
    `Road: ${address.road}`,
    `Building / House: ${address.building}`,
    ...(address.flat ? [`Flat / Apartment: ${address.flat}`] : []),
    ...(address.notes ? [`Address notes: ${address.notes}`] : []),
    ...(address.locationUrl ? [`Google Maps location: ${address.locationUrl}`] : [])
  ] : [];
  const message = details
    ? locale === 'ar'
      ? [
          'طلب جديد من 7Phone',
          `المنتج: ${productName(product, locale)}`,
          `سعر الوحدة: ${formatOrderAmount(Math.round(details.unitPrice * 1000), locale)}`,
          `السعة: ${selectedStorage}`,
          `اللون: ${selectedColor}`,
          ...(details.ram ? [`الرام: ${details.ram}`] : []),
          ...(details.sku ? [`SKU: ${details.sku}`] : []),
          `الكمية: ${details.quantity}`,
          `اسم العميل: ${details.customerName}`,
          `هاتف العميل: ${details.customerPhone}`,
          `طريقة الاستلام: ${deliveryLabel(details.deliveryOption, locale)}`,
          ...arabicAddressLines,
          `طريقة الدفع: ${details.paymentMethod === 'benefit' ? 'BenefitPay' : 'نقدًا عند الاستلام'}`,
          `سعر المنتجات: ${formatOrderAmount(totals!.productsSubtotalFils, locale)}`,
          `رسوم التوصيل: ${formatOrderAmount(totals!.deliveryFeeFils, locale)}`,
          `الإجمالي: ${formatOrderAmount(totals!.grandTotalFils, locale)}`,
          ...(details.receiptFileName ? [`إيصال الدفع المحدد: ${details.receiptFileName}`] : []),
          `ملاحظات: ${details.notes || 'لا يوجد'}`,
          `رابط المنتج: ${productUrl}`
        ].join('\n')
      : [
          'New order from 7Phone',
          `Product: ${productName(product, locale)}`,
          `Unit price: ${formatOrderAmount(Math.round(details.unitPrice * 1000), locale)}`,
          `Storage: ${selectedStorage}`,
          `Color: ${selectedColor}`,
          ...(details.ram ? [`RAM: ${details.ram}`] : []),
          ...(details.sku ? [`SKU: ${details.sku}`] : []),
          `Quantity: ${details.quantity}`,
          `Customer name: ${details.customerName}`,
          `Customer phone: ${details.customerPhone}`,
          `Fulfillment: ${deliveryLabel(details.deliveryOption, locale)}`,
          ...englishAddressLines,
          `Payment Method: ${details.paymentMethod === 'benefit' ? 'BenefitPay' : 'Cash on Delivery'}`,
          `Products: ${formatOrderAmount(totals!.productsSubtotalFils, locale)}`,
          `Delivery Fee: ${formatOrderAmount(totals!.deliveryFeeFils, locale)}`,
          `Total: ${formatOrderAmount(totals!.grandTotalFils, locale)}`,
          ...(details.receiptFileName ? [`Selected payment receipt: ${details.receiptFileName}`] : []),
          `Notes: ${details.notes || 'None'}`,
          `Product page: ${productUrl}`
        ].join('\n')
    : locale === 'ar'
      ? `مرحباً، أنا مهتم بهذا المنتج من 7phone:\n${productName(product, locale)} — ${formatPrice(product.price_bhd, locale)}\n${productUrl}`
      : `Hi, I'm interested in this product from 7phone:\n${productName(product, locale)} — ${formatPrice(product.price_bhd, locale)}\n${productUrl}`;

  return whatsappMessageUrl(settings.whatsapp, message);
}

export function whatsappNotifyWhenAvailableUrl(product: Product, locale: Locale, settings: StoreSettings) {
  const productUrl = productPageUrl(product, locale);
  const message = locale === 'ar'
    ? [
        'مرحباً، أريد أن يتم إبلاغي عند توفر هذا المنتج.',
        `المنتج: ${productName(product, locale)}`,
        `رابط المنتج: ${productUrl}`
      ].join('\n')
    : [
        'Hi, please notify me when this product becomes available.',
        `Product: ${productName(product, locale)}`,
        `Product URL: ${productUrl}`
      ].join('\n');

  return whatsappMessageUrl(settings.whatsapp, message);
}
