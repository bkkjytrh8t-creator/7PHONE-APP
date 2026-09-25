import type {Product} from './types';

function numericStockValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : null;
}

function statusMeansOutOfStock(value: unknown) {
  const status = String(value ?? '').trim().toLowerCase();

  if (!status) {
    return false;
  }

  return [
    '0',
    'false',
    'out',
    'out-of-stock',
    'out_of_stock',
    'unavailable',
    'not-available',
    'not_available',
    'sold-out',
    'sold_out',
    'نفذ',
    'غير متوفر'
  ].includes(status);
}

function statusMeansAvailable(value: unknown) {
  const status = String(value ?? '').trim().toLowerCase();

  return [
    '1',
    'true',
    'available',
    'in-stock',
    'in_stock',
    'in stock',
    'متوفر'
  ].includes(status);
}

export function productIsOutOfStock(product: Product) {
  const record = product as Product & {
    data?: Record<string, unknown>;
    quantity?: unknown;
    stock_quantity?: unknown;
    inventory?: unknown;
    available?: unknown;
  };
  const data = record.data ?? {};
  const quantity = [
    record.quantity,
    record.stock_quantity,
    record.inventory,
    data.quantity,
    data.stock_quantity,
    data.inventory
  ].map(numericStockValue).find((value) => value !== null);

  if (quantity !== undefined) {
    return quantity <= 0;
  }

  if (statusMeansAvailable(record.available ?? data.available)) {
    return false;
  }

  if (statusMeansOutOfStock(record.available ?? data.available)) {
    return true;
  }

  return statusMeansOutOfStock(product.stock_status);
}

export function productAvailabilityLabel(product: Product, locale: 'ar' | 'en') {
  return productIsOutOfStock(product)
    ? locale === 'ar' ? 'غير متوفر' : 'Out of stock'
    : locale === 'ar' ? 'متوفر' : 'Available';
}
