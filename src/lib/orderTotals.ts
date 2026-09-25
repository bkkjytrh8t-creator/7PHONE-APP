import type {Locale} from './types';

export const DELIVERY_FEE_FILS = 2000;

export type FulfillmentMethod = 'pickup' | 'delivery';

export function amountToFils(amount: number) {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 1000);
}

export function calculateOrderTotals({
  unitPrice,
  quantity,
  fulfillment,
  extras = []
}: {
  unitPrice: number;
  quantity: number;
  fulfillment: FulfillmentMethod;
  extras?: number[];
}) {
  const safeQuantity = Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1));
  const productsSubtotalFils = amountToFils(unitPrice) * safeQuantity
    + extras.reduce((sum, price) => sum + amountToFils(price), 0);
  const deliveryFeeFils = fulfillment === 'delivery' ? DELIVERY_FEE_FILS : 0;
  const grandTotalFils = productsSubtotalFils + deliveryFeeFils;

  return {
    productsSubtotalFils,
    deliveryFeeFils,
    grandTotalFils,
    productsSubtotal: productsSubtotalFils / 1000,
    deliveryFee: deliveryFeeFils / 1000,
    grandTotal: grandTotalFils / 1000
  };
}

export function formatOrderAmount(fils: number, locale: Locale) {
  const numericAmount = (fils / 1000).toFixed(3);
  return locale === 'ar' ? `${numericAmount} د.ب` : `${numericAmount} BHD`;
}

export function copyableOrderAmount(fils: number) {
  return (fils / 1000).toFixed(3);
}
