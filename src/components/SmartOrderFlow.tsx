'use client';

import {useEffect, useMemo, useState} from 'react';
import {formatPrice, localizedProductList, localizedProductText, productName} from '@/lib/format';
import type {Locale, Product, StoreSettings} from '@/lib/types';
import {productPageUrl, whatsappMessageUrl} from '@/lib/whatsapp';
import {calculateOrderTotals, formatOrderAmount} from '@/lib/orderTotals';

type LocationState = {lat: number; lng: number} | null;

function orderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `#7P-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function SmartOrderFlow({
  product,
  locale,
  settings
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
}) {
  const storageOptions = localizedProductList(product, 'storage', locale);
  const colorOptions = localizedProductList(product, 'colors', locale);
  const warranty = localizedProductText(product, 'warranty', locale);
  const initialStorage = product.storage_prices[0] ?? {label: storageOptions[0] ?? 'Standard', price_bhd: product.price_bhd};
  const [storage, setStorage] = useState(initialStorage.label);
  const [color, setColor] = useState(colorOptions[0] ?? '');
  const [selectedAccessories, setSelectedAccessories] = useState<number[]>([]);
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('delivery');
  const [payment, setPayment] = useState<'cod' | 'benefit'>('cod');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [location, setLocation] = useState<LocationState>(null);
  const [invoiceNo, setInvoiceNo] = useState('');

  useEffect(() => {
    setInvoiceNo(orderNumber());
  }, []);

  const selectedStorage = product.storage_prices.find((item) => item.label === storage) ?? initialStorage;
  const accessories = product.accessories.filter((item) => selectedAccessories.includes(item.id));
  const totals = calculateOrderTotals({
    unitPrice: selectedStorage.price_bhd,
    quantity: 1,
    fulfillment: delivery,
    extras: accessories.map((item) => item.price_bhd)
  });
  const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';
  const benefitPayAvailable = settings.benefitPayEnabled === true && Boolean(settings.benefitPayQr);
  const text = {
    title: locale === 'ar' ? 'راجع الطلب قبل واتساب' : 'Review order before WhatsApp',
    storagePrice: locale === 'ar' ? 'السعة والسعر' : 'Storage and price',
    color: locale === 'ar' ? 'اللون' : 'Color',
    accessories: locale === 'ar' ? 'اكسسوارات مقترحة' : 'Accessory suggestions',
    delivery: locale === 'ar' ? 'توصيل 2.000 د.ب' : 'Delivery BHD 2.000',
    pickup: locale === 'ar' ? 'استلام مجاني' : 'Free pickup',
    cash: locale === 'ar' ? 'كاش' : 'Cash',
    orderSummary: locale === 'ar' ? 'ملخص الطلب' : 'Order Summary',
    productsSubtotal: locale === 'ar' ? 'سعر المنتجات' : 'Products',
    deliveryFee: locale === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee',
    total: locale === 'ar' ? 'الإجمالي' : 'Total',
    deliveryNote: locale === 'ar' ? 'رسوم التوصيل داخل البحرين: 2.000 د.ب، مضافة إلى الإجمالي.' : 'Bahrain delivery fee: 2.000 BHD, included in the total.',
    name: locale === 'ar' ? 'الاسم' : 'Name',
    phone: locale === 'ar' ? 'رقم الهاتف' : 'Phone number',
    area: locale === 'ar' ? 'المنطقة' : 'Area',
    gpsSaved: locale === 'ar' ? 'تم حفظ الموقع' : 'Location saved',
    gpsShare: locale === 'ar' ? 'مشاركة موقعي GPS' : 'Share my GPS location',
    edit: locale === 'ar' ? 'تعديل' : 'Edit',
    confirm: locale === 'ar' ? 'تأكيد وإرسال' : 'Confirm and send',
    none: locale === 'ar' ? 'بدون' : 'None',
    dash: '-'
  };

  const invoiceText = useMemo(() => {
    const accessoryNames = accessories.map((item) => locale === 'ar' ? item.name_ar : item.name_en);
    const lines = locale === 'ar'
      ? [
          `طلب جديد من 7Phone ${invoiceNo}`,
          `المنتج: ${productName(product, locale)}`,
          `السعة: ${storage}`,
          `اللون: ${color}`,
          `الضمان: ${warranty}`,
          `الاكسسوارات: ${accessoryNames.length ? accessoryNames.join('، ') : 'بدون'}`,
          `الاستلام: ${delivery === 'delivery' ? 'توصيل - 2.000 د.ب' : 'استلام من المحل - مجاني'}`,
          `الدفع: ${payment === 'benefit' ? 'BenefitPay' : 'كاش عند الاستلام'}`,
          `الاسم: ${name || '-'}`,
          `الهاتف: ${phone || '-'}`,
          `المنطقة: ${area || '-'}`,
          `الموقع: ${mapsLink || '-'}`,
          `سعر المنتجات: ${formatOrderAmount(totals.productsSubtotalFils, locale)}`,
          `رسوم التوصيل: ${formatOrderAmount(totals.deliveryFeeFils, locale)}`,
          `الإجمالي: ${formatOrderAmount(totals.grandTotalFils, locale)}`,
          `رابط المنتج: ${productPageUrl(product, locale)}`
        ]
      : [
          `New order from 7Phone ${invoiceNo}`,
          `Product: ${productName(product, locale)}`,
          `Storage: ${storage}`,
          `Color: ${color}`,
          `Warranty: ${warranty}`,
          `Accessories: ${accessoryNames.length ? accessoryNames.join(', ') : 'None'}`,
          `Delivery option: ${delivery === 'delivery' ? 'Delivery - BHD 2.000' : 'Pickup from store - Free'}`,
          `Payment: ${payment === 'benefit' ? 'BenefitPay' : 'Cash on delivery'}`,
          `Name: ${name || '-'}`,
          `Phone: ${phone || '-'}`,
          `Area: ${area || '-'}`,
          `Location: ${mapsLink || '-'}`,
          `Products subtotal: ${formatOrderAmount(totals.productsSubtotalFils, locale)}`,
          `Delivery fee: ${formatOrderAmount(totals.deliveryFeeFils, locale)}`,
          `Grand total: ${formatOrderAmount(totals.grandTotalFils, locale)}`,
          `Product URL: ${productPageUrl(product, locale)}`
        ];
    return lines.join('\n');
  }, [accessories, area, color, delivery, invoiceNo, locale, mapsLink, name, payment, phone, product, storage, totals.deliveryFeeFils, totals.grandTotalFils, totals.productsSubtotalFils, warranty]);

  function toggleAccessory(id: number) {
    setSelectedAccessories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function useGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6))
      });
    });
  }

  const whatsappUrl = whatsappMessageUrl(settings.whatsapp, invoiceText);

  return (
    <section id="order" className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-neon md:p-5">
      <div>
        <p className="text-xs font-black text-brand-neon">7PHONE SMART ORDER</p>
        <h2 className="mt-1 text-2xl font-black text-white">{text.title}</h2>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-bold text-white/80">
          {text.storagePrice}
          <select className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" value={storage} onChange={(event) => setStorage(event.target.value)}>
            {product.storage_prices.map((item) => (
              <option key={item.label} value={item.label}>{item.label} - {formatPrice(item.price_bhd, locale)}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-bold text-white/80">{text.color}</span>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((item) => (
              <button className={`rounded-full border px-4 py-2 text-sm font-black ${color === item ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-white/5 text-white'}`} key={item} onClick={() => setColor(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-bold text-white/80">{text.accessories}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {product.accessories.map((item) => (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-3 text-sm font-bold text-white" key={item.id}>
                <span>{locale === 'ar' ? item.name_ar : item.name_en}</span>
                <span className="flex items-center gap-2 text-brand-neon">
                  {formatPrice(item.price_bhd, locale)}
                  <input className="accent-brand-neon" checked={selectedAccessories.includes(item.id)} onChange={() => toggleAccessory(item.id)} type="checkbox" />
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className={`h-12 rounded-xl border text-sm font-black ${delivery === 'delivery' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setDelivery('delivery')} type="button">{text.delivery}</button>
          <button className={`h-12 rounded-xl border text-sm font-black ${delivery === 'pickup' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setDelivery('pickup')} type="button">{text.pickup}</button>
        </div>

        <section className="grid gap-2 rounded-xl border border-white/10 bg-black/40 p-4" aria-label={text.orderSummary}>
          <strong>{text.orderSummary}</strong>
          <div className="flex justify-between gap-3 text-sm text-white/75"><span>{text.productsSubtotal}</span><span>{formatOrderAmount(totals.productsSubtotalFils, locale)}</span></div>
          <div className="flex justify-between gap-3 text-sm text-white/75"><span>{text.deliveryFee}</span><span>{formatOrderAmount(totals.deliveryFeeFils, locale)}</span></div>
          <div className="flex justify-between gap-3 border-t border-white/10 pt-2 font-black"><span>{text.total}</span><span className="text-brand-neon">{formatOrderAmount(totals.grandTotalFils, locale)}</span></div>
          {delivery === 'delivery' ? <small className="text-white/50">{text.deliveryNote}</small> : null}
        </section>

        <div className={benefitPayAvailable ? 'grid grid-cols-2 gap-2' : 'grid'}>
          <button className={`h-12 rounded-xl border text-sm font-black ${payment === 'cod' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setPayment('cod')} type="button">{text.cash}</button>
          {benefitPayAvailable ? <button className={`h-12 rounded-xl border text-sm font-black ${payment === 'benefit' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setPayment('benefit')} type="button">BenefitPay</button> : null}
        </div>

        {payment === 'benefit' && benefitPayAvailable ? (
          <div className="grid gap-3 rounded-xl border border-brand-neon/40 bg-black p-3 text-sm font-bold text-white sm:grid-cols-[96px_1fr] sm:items-center">
            <img alt="BenefitPay QR" className="h-24 w-24 rounded-lg bg-white p-2" src={settings.benefitPayQr} />
            <div>
              <p className="text-brand-neon">BenefitPay QR / IBAN</p>
              {settings.benefitPayAccountHolder ? <p className="mt-1">{settings.benefitPayAccountHolder}</p> : null}
              {settings.benefitPayPhone ? <p className="mt-1" dir="ltr">{settings.benefitPayPhone}</p> : null}
              {settings.iban ? <p className="mt-1 break-all">{settings.iban}</p> : null}
              {(locale === 'ar' ? settings.benefitPayInstructionsAr : settings.benefitPayInstructionsEn) ? <p className="mt-2 text-white/75">{locale === 'ar' ? settings.benefitPayInstructionsAr : settings.benefitPayInstructionsEn}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <input className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" placeholder={text.name} value={name} onChange={(event) => setName(event.target.value)} />
          <input className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" placeholder={text.phone} value={phone} onChange={(event) => setPhone(event.target.value)} />
          <input className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" placeholder={text.area} value={area} onChange={(event) => setArea(event.target.value)} />
        </div>

        <button className="h-12 rounded-xl border border-white/10 bg-white/10 text-sm font-black text-white hover:border-brand-neon" onClick={useGps} type="button">
          {location ? `${text.gpsSaved}: ${location.lat}, ${location.lng}` : text.gpsShare}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <strong>{invoiceNo}</strong>
          <strong className="text-2xl text-brand-neon">{formatOrderAmount(totals.grandTotalFils, locale)}</strong>
        </div>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/78">{invoiceText}</pre>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a className="grid h-12 place-items-center rounded-xl bg-white text-sm font-black text-black" href="#order">{text.edit}</a>
          <a className="grid h-12 place-items-center rounded-xl bg-brand-neon text-sm font-black text-white" href={whatsappUrl} target="_blank" rel="noreferrer">{text.confirm}</a>
        </div>
      </div>
    </section>
  );
}
