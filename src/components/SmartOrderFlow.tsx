'use client';

import {useMemo, useState} from 'react';
import {formatPrice, productName} from '@/lib/format';
import type {Locale, Product, StoreSettings} from '@/lib/types';

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
  const initialStorage = product.storage_prices[0] ?? {label: product.storage[0] ?? 'Standard', price_bhd: product.price_bhd};
  const [storage, setStorage] = useState(initialStorage.label);
  const [color, setColor] = useState(product.colors[0] ?? '');
  const [selectedAccessories, setSelectedAccessories] = useState<number[]>([]);
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('delivery');
  const [payment, setPayment] = useState<'cod' | 'benefit'>('cod');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [location, setLocation] = useState<LocationState>(null);
  const [invoiceNo] = useState(orderNumber);

  const selectedStorage = product.storage_prices.find((item) => item.label === storage) ?? initialStorage;
  const accessories = product.accessories.filter((item) => selectedAccessories.includes(item.id));
  const deliveryFee = delivery === 'delivery' ? 2 : 0;
  const total = selectedStorage.price_bhd + accessories.reduce((sum, item) => sum + item.price_bhd, 0) + deliveryFee;
  const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';

  const invoiceText = useMemo(() => {
    const lines = [
      `طلب جديد من 7Phone ${invoiceNo}`,
      `المنتج: ${productName(product, locale)}`,
      `السعة: ${storage}`,
      `اللون: ${color}`,
      `الضمان: ${product.warranty}`,
      `الاكسسوارات: ${accessories.length ? accessories.map((item) => item.name_ar).join('، ') : 'بدون'}`,
      `الاستلام: ${delivery === 'delivery' ? 'توصيل - 2.000 د.ب' : 'استلام من المحل - مجاني'}`,
      `الدفع: ${payment === 'benefit' ? 'BenefitPay' : 'كاش عند الاستلام'}`,
      `الاسم: ${name || '-'}`,
      `الهاتف: ${phone || '-'}`,
      `المنطقة: ${area || '-'}`,
      `الموقع: ${mapsLink || '-'}`,
      `المجموع: ${formatPrice(total, locale)}`
    ];
    return lines.join('\n');
  }, [accessories, area, color, delivery, invoiceNo, locale, mapsLink, name, payment, phone, product, storage, total]);

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

  const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(invoiceText)}`;

  return (
    <section id="order" className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-neon md:p-5">
      <div>
        <p className="text-xs font-black text-brand-neon">7PHONE SMART ORDER</p>
        <h2 className="mt-1 text-2xl font-black text-white">راجع الطلب قبل واتساب</h2>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-bold text-white/80">
          السعة والسعر
          <select className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" value={storage} onChange={(event) => setStorage(event.target.value)}>
            {product.storage_prices.map((item) => (
              <option key={item.label} value={item.label}>{item.label} - {formatPrice(item.price_bhd, locale)}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-bold text-white/80">اللون</span>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((item) => (
              <button className={`rounded-full border px-4 py-2 text-sm font-black ${color === item ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-white/5 text-white'}`} key={item} onClick={() => setColor(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-bold text-white/80">اكسسوارات مقترحة</span>
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
          <button className={`h-12 rounded-xl border text-sm font-black ${delivery === 'delivery' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setDelivery('delivery')} type="button">توصيل 2.000 د.ب</button>
          <button className={`h-12 rounded-xl border text-sm font-black ${delivery === 'pickup' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setDelivery('pickup')} type="button">استلام مجاني</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className={`h-12 rounded-xl border text-sm font-black ${payment === 'cod' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setPayment('cod')} type="button">كاش</button>
          <button className={`h-12 rounded-xl border text-sm font-black ${payment === 'benefit' ? 'border-brand-neon bg-brand-neon text-white' : 'border-white/10 bg-black text-white'}`} onClick={() => setPayment('benefit')} type="button">BenefitPay</button>
        </div>

        {payment === 'benefit' ? (
          <div className="grid gap-3 rounded-xl border border-brand-neon/40 bg-black p-3 text-sm font-bold text-white sm:grid-cols-[96px_1fr] sm:items-center">
            <img alt="BenefitPay QR" className="h-24 w-24 rounded-lg bg-white p-2" src={settings.benefitPayQr} />
            <div>
              <p className="text-brand-neon">BenefitPay QR / IBAN</p>
              <p className="mt-1 break-all">{settings.iban}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <input className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" placeholder="الاسم" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" placeholder="رقم الهاتف" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <input className="h-12 rounded-xl border border-white/10 bg-black px-4 text-white outline-none focus:border-brand-neon" placeholder="المنطقة" value={area} onChange={(event) => setArea(event.target.value)} />
        </div>

        <button className="h-12 rounded-xl border border-white/10 bg-white/10 text-sm font-black text-white hover:border-brand-neon" onClick={useGps} type="button">
          {location ? `تم حفظ الموقع: ${location.lat}, ${location.lng}` : 'مشاركة موقعي GPS'}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <strong>{invoiceNo}</strong>
          <strong className="text-2xl text-brand-neon">{formatPrice(total, locale)}</strong>
        </div>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/78">{invoiceText}</pre>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a className="grid h-12 place-items-center rounded-xl bg-white text-sm font-black text-black" href="#order">تعديل</a>
          <a className="grid h-12 place-items-center rounded-xl bg-brand-neon text-sm font-black text-white" href={whatsappUrl} target="_blank" rel="noreferrer">تأكيد وإرسال</a>
        </div>
      </div>
    </section>
  );
}
