'use client';

import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {formatPrice, localizedProductList, productName} from '@/lib/format';
import type {Locale, Product, ProductVariant, StoreSettings} from '@/lib/types';
import {whatsappOrderUrl} from '@/lib/whatsapp';
import {calculateOrderTotals, copyableOrderAmount, formatOrderAmount} from '@/lib/orderTotals';
import {primaryProductImage} from '@/lib/productNormalize';
import {ProductShareButton} from './ProductShareButton';
import {variantColor, variantPrice} from '@/lib/variants';

const copy = {
  ar: {
    title: 'تأكيد الطلب عبر واتساب',
    intro: 'راجع بيانات الطلب قبل فتح واتساب.',
    customerName: 'الاسم',
    customerPhone: 'رقم الهاتف',
    product: 'المنتج',
    storage: 'السعة',
    color: 'اللون',
    ram: 'الذاكرة (RAM)',
    quantity: 'الكمية',
    delivery: 'طريقة الاستلام',
    pickup: 'استلام من المحل',
    deliveryOption: 'توصيل',
    area: 'المنطقة',
    block: 'المجمع',
    road: 'الطريق',
    building: 'المبنى / المنزل',
    flat: 'الشقة / رقم الشقة اختياري',
    addressNotes: 'ملاحظات العنوان / علامة مميزة اختياري',
    locationUrl: 'رابط موقع Google Maps اختياري',
    useLocation: 'استخدام موقعي الحالي',
    locationCaptured: 'تم حفظ الموقع',
    locationUnavailable: 'تعذر تحديد الموقع. يمكنك إدخال العنوان أو لصق رابط الموقع.',
    deliveryMissing: 'أكمل بيانات عنوان التوصيل: المنطقة، المجمع، الطريق، والمبنى / المنزل.',
    paymentMethod: 'طريقة الدفع',
    benefitPay: 'BenefitPay',
    cashOnDelivery: 'نقدًا عند الاستلام',
    cashMessage: 'الدفع نقدًا عند استلام الطلب',
    paymentMissing: 'اختر طريقة الدفع.',
    paymentInstructions: 'تعليمات الدفع',
    beneficiaryName: 'اسم المستفيد',
    iban: 'IBAN',
    amount: 'المبلغ',
    copy: 'نسخ',
    copyIban: 'نسخ IBAN',
    copyAmount: 'نسخ المبلغ',
    copied: 'تم النسخ بنجاح',
    total: 'إجمالي الطلب',
    orderSummary: 'ملخص الطلب',
    productsSubtotal: 'سعر المنتجات',
    deliveryFee: 'رسوم التوصيل',
    deliveryFeeNote: 'رسوم التوصيل داخل البحرين: 2.000 د.ب، مضافة إلى الإجمالي.',
    amountDue: 'المبلغ المطلوب عند الاستلام',
    requiredPaymentAmount: 'المبلغ المطلوب للدفع',
    openQr: 'فتح QR بالحجم الكامل',
    saveQr: 'حفظ صورة QR',
    receipt: 'إيصال الدفع',
    receiptRequired: 'ارفع إيصال الدفع لإكمال طلب BenefitPay.',
    uploadReceipt: 'رفع إيصال الدفع',
    replaceReceipt: 'استبدال الإيصال',
    removeReceipt: 'حذف الإيصال',
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
    ram: 'RAM',
    quantity: 'Quantity',
    delivery: 'Delivery option',
    pickup: 'Pickup from store',
    deliveryOption: 'Delivery',
    area: 'Area',
    block: 'Block',
    road: 'Road',
    building: 'Building / House',
    flat: 'Flat / Apartment optional',
    addressNotes: 'Address notes / Landmark optional',
    locationUrl: 'Google Maps location link optional',
    useLocation: 'Use My Current Location',
    locationCaptured: 'Location captured',
    locationUnavailable: 'Could not capture location. You can enter the address or paste a location link.',
    deliveryMissing: 'Complete the delivery address: area, block, road, and building / house.',
    paymentMethod: 'Payment Method',
    benefitPay: 'BenefitPay',
    cashOnDelivery: 'Cash on Delivery',
    cashMessage: 'Payment in cash when the order is delivered',
    paymentMissing: 'Choose a payment method.',
    paymentInstructions: 'Payment instructions',
    beneficiaryName: 'Beneficiary Name',
    iban: 'IBAN',
    amount: 'Amount',
    copy: 'Copy',
    copyIban: 'Copy IBAN',
    copyAmount: 'Copy Amount',
    copied: 'Copied successfully',
    total: 'Order total',
    orderSummary: 'Order Summary',
    productsSubtotal: 'Products',
    deliveryFee: 'Delivery Fee',
    deliveryFeeNote: 'Bahrain delivery fee: 2.000 BHD, included in the total.',
    amountDue: 'Amount due on delivery',
    requiredPaymentAmount: 'Required payment amount',
    openQr: 'Open QR full size',
    saveQr: 'Download QR image',
    receipt: 'Payment receipt',
    receiptRequired: 'Upload the payment receipt to complete a BenefitPay order.',
    uploadReceipt: 'Upload payment receipt',
    replaceReceipt: 'Replace receipt',
    removeReceipt: 'Remove receipt',
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
  large = false,
  cardPurchase = false,
  autoOpen = false,
  selectedVariant = null
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
  label: string;
  large?: boolean;
  cardPurchase?: boolean;
  autoOpen?: boolean;
  selectedVariant?: ProductVariant | null;
}) {
  const text = copy[locale];
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'benefit' | 'cash' | ''>('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const receiptInput = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState('');
  const [area, setArea] = useState('');
  const [block, setBlock] = useState('');
  const [road, setRoad] = useState('');
  const [building, setBuilding] = useState('');
  const [flat, setFlat] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [copyToast, setCopyToast] = useState('');
  const storageOptions = product.storage_prices.length
    ? product.storage_prices.map((item) => item.label)
    : localizedProductList(product, 'storage', locale);
  const colorOptions = localizedProductList(product, 'colors', locale);
  const benefitPayAvailable = settings.benefitPayEnabled === true && Boolean(settings.benefitPayQr?.trim());
  const selectedUnitPrice = selectedVariant
    ? variantPrice(product, selectedVariant)
    : product.storage_prices.find((item) => item.label === storage)?.price_bhd ?? product.price_bhd;
  const totals = calculateOrderTotals({unitPrice: selectedUnitPrice, quantity, fulfillment: deliveryOption});
  const paymentInstructions = (locale === 'ar' ? settings.benefitPayInstructionsAr : settings.benefitPayInstructionsEn) || (locale === 'ar'
    ? 'امسح رمز QR وادفع المبلغ الإجمالي، ثم ارفع صورة إيصال الدفع.'
    : 'Scan the QR code and pay the total amount, then upload the payment receipt.');
  const productImage = primaryProductImage(product);

  useEffect(() => {
    if (!selectedVariant) return;
    setStorage(selectedVariant.storage ?? '');
    setColor(variantColor(selectedVariant, locale));
  }, [locale, selectedVariant]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  useEffect(() => () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
  }, [receiptPreview]);

  useEffect(() => {
    if (!benefitPayAvailable && paymentMethod === 'benefit') {
      setPaymentMethod('');
      removeReceipt();
    }
  }, [benefitPayAvailable, paymentMethod]);

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

  function clearDeliveryAddress() {
    setArea('');
    setBlock('');
    setRoad('');
    setBuilding('');
    setFlat('');
    setAddressNotes('');
    setLocationUrl('');
    setLocationStatus('idle');
    setError('');
  }

  function updateDeliveryOption(nextOption: 'pickup' | 'delivery') {
    setDeliveryOption(nextOption);

    if (nextOption === 'pickup') {
      clearDeliveryAddress();
    }
  }

  function useCurrentLocation() {
    setError('');

    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        setLocationUrl(`https://maps.google.com/?q=${latitude},${longitude}`);
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
      },
      {enableHighAccuracy: true, timeout: 10000, maximumAge: 60000}
    );
  }

  function selectReceipt(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(text.receiptRequired);
      return;
    }
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
    setError('');
  }

  function removeReceipt() {
    setReceipt(null);
    setReceiptPreview('');
    if (receiptInput.current) receiptInput.current.value = '';
  }

  async function copyPaymentValue(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopyToast(text.copied);
    window.setTimeout(() => setCopyToast(''), 1800);
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (
      deliveryOption === 'delivery' &&
      (!area.trim() || !block.trim() || !road.trim() || !building.trim())
    ) {
      setError(text.deliveryMissing);
      return;
    }

    if (!paymentMethod) {
      setError(text.paymentMissing);
      return;
    }

    if (paymentMethod === 'benefit' && !receipt) {
      setError(text.receiptRequired);
      return;
    }

    const url = whatsappOrderUrl(product, locale, settings, {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      storage: storage || text.notSelected,
      color: color || text.notSelected,
      ram: selectedVariant?.ram || text.notSelected,
      sku: selectedVariant?.sku,
      quantity,
      deliveryOption,
      paymentMethod,
      unitPrice: selectedUnitPrice,
      receiptFileName: paymentMethod === 'benefit' ? receipt?.name : undefined,
      notes: notes.trim(),
      address: deliveryOption === 'delivery'
        ? {
            area: area.trim(),
            block: block.trim(),
            road: road.trim(),
            building: building.trim(),
            flat: flat.trim(),
            notes: addressNotes.trim(),
            locationUrl: locationUrl.trim()
          }
        : undefined
    });

    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-[100] overflow-hidden overscroll-none bg-black/75 md:grid md:place-items-center md:p-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div className="h-[100dvh] w-screen md:h-[min(90dvh,900px)] md:w-[min(1000px,calc(100vw-40px))]">
        <form
          className="relative flex h-full w-full flex-col overflow-hidden bg-[#08080a] text-white shadow-neon md:rounded-2xl md:border md:border-white/10"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          noValidate
          onSubmit={submitOrder}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-4 md:px-6">
            <div>
              <h2 className="text-xl font-black">{text.title}</h2>
              <p className="mt-1 text-sm font-semibold text-white/55">{text.intro}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ProductShareButton compact dark product={product} locale={locale} selectedVariant={selectedVariant} />
              <button
                aria-label={text.cancel}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-xl font-black"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto overscroll-contain px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div className="grid content-start gap-4">
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

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.delivery}
              <select className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={deliveryOption} onChange={(event) => updateDeliveryOption(event.target.value as 'pickup' | 'delivery')}>
                <option value="pickup">{text.pickup}</option>
                <option value="delivery">{text.deliveryOption}</option>
              </select>
            </label>
          </div>

          {deliveryOption === 'delivery' ? (
            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                  {text.area}
                  <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" required value={area} onChange={(event) => setArea(event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                  {text.block}
                  <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" inputMode="numeric" pattern="[0-9]*" required value={block} onChange={(event) => setBlock(event.target.value)} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                  {text.road}
                  <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" inputMode="numeric" pattern="[0-9]*" required value={road} onChange={(event) => setRoad(event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                  {text.building}
                  <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" required value={building} onChange={(event) => setBuilding(event.target.value)} />
                </label>
              </div>
              <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                {text.flat}
                <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={flat} onChange={(event) => setFlat(event.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                {text.addressNotes}
                <textarea className="min-h-16 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-brand-neon" value={addressNotes} onChange={(event) => setAddressNotes(event.target.value)} />
              </label>
              <div className="grid gap-2">
                <button className="h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white hover:border-brand-neon" onClick={useCurrentLocation} type="button">
                  {text.useLocation}
                </button>
                {locationStatus === 'success' ? <p className="text-xs font-bold text-emerald-400">{text.locationCaptured}</p> : null}
                {locationStatus === 'error' ? <p className="text-xs font-bold text-amber-300">{text.locationUnavailable}</p> : null}
              </div>
              <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
                {text.locationUrl}
                <input className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" dir="ltr" type="url" value={locationUrl} onChange={(event) => {
                  setLocationUrl(event.target.value);
                  setLocationStatus(event.target.value.trim() ? 'success' : 'idle');
                }} />
              </label>
            </div>
          ) : null}

          <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
            {text.notes}
            <textarea className="min-h-24 rounded-xl border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none focus:border-brand-neon" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          </div>

          <div className="grid content-start gap-4">
          <div className="grid grid-cols-[72px_1fr] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            {productImage ? <img alt={productName(product, locale)} className="h-[72px] w-[72px] rounded-xl bg-white object-contain p-1" src={productImage} /> : <div className="grid h-[72px] w-[72px] place-items-center rounded-xl bg-white/10 text-xs font-black">7P</div>}
            <div className="min-w-0">
              <span className="text-xs font-black uppercase text-white/40">{text.product}</span>
              <strong className="mt-1 block text-sm">{productName(product, locale)}</strong>
              <span className="mt-1 block text-sm font-black text-brand-neon">{formatPrice(selectedUnitPrice, locale)}</span>
            </div>
          </div>

          {selectedVariant ? (
            <div className="grid gap-2 rounded-xl border border-white/10 bg-black p-3 text-sm sm:grid-cols-2">
              <p><span className="text-white/45">{text.color}: </span><strong>{color || text.notSelected}</strong></p>
              <p><span className="text-white/45">{text.storage}: </span><strong>{storage || text.notSelected}</strong></p>
              {selectedVariant.ram ? <p><span className="text-white/45">{text.ram}: </span><strong>{selectedVariant.ram}</strong></p> : null}
              {selectedVariant.sku ? <p dir="ltr"><span className="text-white/45">SKU: </span><strong>{selectedVariant.sku}</strong></p> : null}
            </div>
          ) : <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.storage}
              <select className="h-12 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={storage} onChange={(event) => setStorage(event.target.value)}>
                <option value="">{text.notSelected}</option>
                {storageOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50">
              {text.color}
              <select className="h-12 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" value={color} onChange={(event) => setColor(event.target.value)}>
                <option value="">{text.notSelected}</option>
                {colorOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-white/50 sm:col-span-2">
              {text.quantity}
              <input className="h-12 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-brand-neon" min="1" required type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} />
            </label>
          </div>}

          <section aria-label={text.orderSummary} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-sm font-black text-white">{text.orderSummary}</h3>
            <div className="flex items-center justify-between gap-3 text-sm text-white/75">
              <span>{text.productsSubtotal}</span>
              <strong className="text-white">{formatOrderAmount(totals.productsSubtotalFils, locale)}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-white/75">
              <span>{text.deliveryFee}</span>
              <strong className="text-white">{formatOrderAmount(totals.deliveryFeeFils, locale)}</strong>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-base">
              <span className="font-black">{text.total}</span>
              <strong className="text-lg text-brand-neon">{formatOrderAmount(totals.grandTotalFils, locale)}</strong>
            </div>
            {deliveryOption === 'delivery' ? <p className="text-xs font-semibold text-white/50">{text.deliveryFeeNote}</p> : null}
          </section>

          <fieldset className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <legend className="px-1 text-xs font-black uppercase text-white/50">{text.paymentMethod}</legend>
            <div className={benefitPayAvailable ? 'grid grid-cols-2 gap-2' : 'grid'}>
              {benefitPayAvailable ? <button className={`h-11 rounded-xl border text-sm font-black ${paymentMethod === 'benefit' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => {setPaymentMethod('benefit'); setError('');}} type="button">{text.benefitPay}</button> : null}
              <button className={`h-11 rounded-xl border text-sm font-black ${paymentMethod === 'cash' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => {setPaymentMethod('cash'); removeReceipt(); setError('');}} type="button">{text.cashOnDelivery}</button>
            </div>

            {paymentMethod === 'cash' ? <div className="rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white/75"><p>{text.cashMessage}</p><p className="mt-2 text-brand-neon">{text.amountDue}: {formatOrderAmount(totals.grandTotalFils, locale)}</p></div> : null}

            {paymentMethod === 'benefit' && benefitPayAvailable ? <div className="grid gap-3">
              <div className="grid gap-3 rounded-xl border border-brand-neon/30 bg-black p-3 sm:grid-cols-[140px_1fr] sm:items-center">
                <img alt="BenefitPay QR" className="aspect-square w-full rounded-xl bg-white object-contain p-2" src={settings.benefitPayQr} />
                <div className="grid gap-2 text-sm">
                  <span className="text-xs font-black uppercase text-white/40">{text.paymentInstructions}</span>
                  {paymentInstructions ? <p className="whitespace-pre-wrap font-semibold text-white/80">{paymentInstructions}</p> : null}
                  <p className="font-black text-brand-neon">{text.requiredPaymentAmount}: {formatOrderAmount(totals.grandTotalFils, locale)}</p>
                  <div className="grid gap-2">
                    <a className="grid h-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white" href={settings.benefitPayQr} rel="noreferrer" target="_blank">{text.openQr}</a>
                    <a className="grid h-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white" download="benefitpay-qr" href={settings.benefitPayQr}>{text.saveQr}</a>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                {settings.benefitPayAccountHolder ? <div className="grid gap-2 rounded-xl border border-white/10 bg-black p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0"><span className="text-xs font-black uppercase text-white/40">{text.beneficiaryName}</span><p className="mt-1 break-words text-sm font-bold text-white">{settings.benefitPayAccountHolder}</p></div>
                  <button className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white" onClick={() => void copyPaymentValue(settings.benefitPayAccountHolder)} type="button">{text.copy}</button>
                </div> : null}
                {settings.iban ? <div className="grid gap-2 rounded-xl border border-white/10 bg-black p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0"><span className="text-xs font-black uppercase text-white/40">{text.iban}</span><p className="mt-1 break-all text-sm font-bold text-white" dir="ltr">{settings.iban}</p></div>
                  <button className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white" onClick={() => void copyPaymentValue(settings.iban)} type="button">{text.copyIban}</button>
                </div> : null}
                <div className="grid gap-2 rounded-xl border border-white/10 bg-black p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div><span className="text-xs font-black uppercase text-white/40">{text.amount}</span><p className="mt-1 text-sm font-black text-brand-neon">{formatOrderAmount(totals.grandTotalFils, locale)}</p></div>
                  <button className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white" onClick={() => void copyPaymentValue(copyableOrderAmount(totals.grandTotalFils))} type="button">{text.copyAmount}</button>
                </div>
              </div>
              <div className="grid gap-2">
                <span className="text-xs font-black uppercase text-white/50">{text.receipt} *</span>
                <input ref={receiptInput} accept="image/*" className="hidden" onChange={(event) => {const file = event.target.files?.[0]; if (file) selectReceipt(file);}} type="file" />
                {receiptPreview ? <img alt={text.receipt} className="max-h-64 w-full rounded-xl border border-white/10 bg-black object-contain" src={receiptPreview} /> : null}
                <div className="flex flex-wrap gap-2">
                  <button className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white" onClick={() => receiptInput.current?.click()} type="button">{receipt ? text.replaceReceipt : text.uploadReceipt}</button>
                  {receipt ? <button className="h-10 rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-xs font-black text-red-200" onClick={removeReceipt} type="button">{text.removeReceipt}</button> : null}
                </div>
              </div>
            </div> : null}
          </fieldset>
          </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#08080a]/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="lg:ms-[calc(50%+0.75rem)]">
            {error ? <p className="mb-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">{error}</p> : null}
            <div className="grid grid-cols-2 gap-3">
            <button className="h-12 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white" onClick={() => setIsOpen(false)} type="button">
              {text.cancel}
            </button>
            <button className="h-12 rounded-xl bg-brand-whatsapp text-sm font-black text-white" type="submit">
              {text.confirm}
            </button>
            </div>
            </div>
          </div>
          {copyToast ? <div aria-live="polite" className="pointer-events-none absolute bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-xl">{copyToast}</div> : null}
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        aria-label={label}
        className={cardPurchase
          ? 'box-border inline-flex h-[46px] min-w-0 w-full touch-manipulation items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-brand-neon px-2.5 text-[13px] font-black text-white transition hover:brightness-110 active:scale-[0.98] active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-3 sm:text-sm'
          : `inline-flex w-full items-center justify-center rounded-full bg-brand-neon font-black text-white transition hover:brightness-105 ${large ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-xs'}`}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {cardPurchase ? <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20.5 8H6.2M10 20h.01M17 20h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg> : null}
        <span className={cardPurchase ? 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap' : undefined}>{label}</span>
      </button>
      {isMounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
