'use client';

import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {formatPrice, productName} from '@/lib/format';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {whatsappOrderUrl} from '@/lib/whatsapp';

const copy = {
  ar: {
    title: 'تأكيد الطلب عبر واتساب',
    intro: 'راجع بيانات الطلب قبل فتح واتساب.',
    customerName: 'الاسم',
    customerPhone: 'رقم الهاتف',
    product: 'المنتج',
    storage: 'السعة',
    color: 'اللون',
    quantity: 'الكمية',
    delivery: 'طريقة الاستلام',
    pickup: 'استلام من المحل',
    deliveryOption: 'توصيل',
    notes: 'ملاحظات اختيارية',
    confirm: 'تأكيد الطلب عبر واتساب',
    cancel: 'إلغاء',
    notSelected: 'غير محدد'
  },
  en: {
    title: 'Confirm WhatsApp Order',
    intro: 'Review the order details before opening WhatsApp.',
    customerName: 'Customer name',
    customerPhone: 'Phone number',
    product: 'Selected product',
    storage: 'Storage',
    color: 'Color',
    quantity: 'Quantity',
    delivery: 'Delivery option',
    pickup: 'Pickup from store',
    deliveryOption: 'Delivery',
    notes: 'Notes optional',
    confirm: 'Confirm WhatsApp Order',
    cancel: 'Cancel',
    notSelected: 'Not selected'
  }
};

export function WhatsAppButton({
  product,
  locale,
  settings,
  label,
  large = false
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
  label: string;
  large?: boolean;
}) {
  const text = copy[locale];
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup');
  const [notes, setNotes] = useState('');
  const storageOptions = product.storage_prices.length
    ? product.storage_prices.map((item) => item.label)
    : product.storage;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollY = window.scrollY;
    const previousBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousBodyStyle.overflow;
      document.body.style.position = previousBodyStyle.position;
      document.body.style.top = previousBodyStyle.top;
      document.body.style.width = previousBodyStyle.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const url = whatsappOrderUrl(product, locale, settings, {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      storage: storage || text.notSelected,
      color: color || text.notSelected,
      quantity,
      deliveryOption,
      notes: notes.trim()
    });

    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/75 px-4 py-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-lg items-center">
        <form
          className="grid w-full gap-3 rounded-2xl border border-white/10 bg-[#08080a] p-4 text-white shadow-neon"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          onSubmit={submitOrder}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{text.title}</h2>
              <p className="mt-1 text-sm font-semibold text-white/55">{text.intro}</p>
            </div>
            <button
              aria-label={text.cancel}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-lg font-black"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <span className="text-xs font-black uppercase text-white/40">{text.product}</span>
            <strong className="mt-1 block text-sm">{productName(product, locale)}</strong>
            <span className="mt-1 block text-sm font-black text-brand-neon">{formatPrice(product.price_bhd, locale)}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.customerName}
              <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" required value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.customerPhone}
              <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" required type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.storage}
              <select className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={storage} onChange={(event) => setStorage(event.target.value)}>
                <option value="">{text.notSelected}</option>
                {storageOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.color}
              <select className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={color} onChange={(event) => setColor(event.target.value)}>
                <option value="">{text.notSelected}</option>
                {product.colors.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.quantity}
              <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" min="1" required type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} />
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.delivery}
              <select className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={deliveryOption} onChange={(event) => setDeliveryOption(event.target.value as 'pickup' | 'delivery')}>
                <option value="pickup">{text.pickup}</option>
                <option value="delivery">{text.deliveryOption}</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
            {text.notes}
            <textarea className="min-h-20 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-neon" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button className="h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white" onClick={() => setIsOpen(false)} type="button">
              {text.cancel}
            </button>
            <button className="h-11 rounded-xl bg-brand-whatsapp text-sm font-black text-white" type="submit">
              {text.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        className={`inline-flex w-full items-center justify-center rounded-full bg-brand-whatsapp font-black text-white transition hover:brightness-95 ${
          large ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-xs'
        }`}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {label}
      </button>
      {isMounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
