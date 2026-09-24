'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Locale, StoreSettings} from '@/lib/types';
import {amountToFils, DELIVERY_FEE_FILS, formatOrderAmount} from '@/lib/orderTotals';
import {whatsappMessageUrl} from '@/lib/whatsapp';
import {FallbackImage} from './FallbackImage';
import {useCart} from './CartProvider';

type Method = 'pickup' | 'delivery';

export function CartButton({locale, settings}: {locale: Locale; settings: StoreSettings}) {
  const cart = useCart();
  const [checkout, setCheckout] = useState(false);
  const [method, setMethod] = useState<Method>('pickup');
  const [error, setError] = useState('');
  const subtotalFils = useMemo(() => cart.items.reduce((sum, item) => sum + amountToFils(item.price) * item.quantity, 0), [cart.items]);
  const deliveryFils = method === 'delivery' ? DELIVERY_FEE_FILS : 0;
  const isAr = locale === 'ar';

  useEffect(() => {
    if (!cart.open) setCheckout(false);
    document.body.style.overflow = cart.open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cart.open]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const required = ['name', 'phone', ...(method === 'delivery' ? ['area', 'block', 'road', 'building'] : [])];
    if (required.some((field) => !String(form.get(field) ?? '').trim())) {
      setError(isAr ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please complete all required fields.');
      return;
    }
    const lines = isAr ? [
      'طلب جديد من 7Phone', '', `الاسم: ${form.get('name')}`, `الهاتف: ${form.get('phone')}`, `الطريقة: ${method === 'delivery' ? 'توصيل' : 'استلام من المحل'}`,
      ...(method === 'delivery' ? ['', 'العنوان:', `المنطقة: ${form.get('area')}`, `المجمع: ${form.get('block')}`, `الطريق: ${form.get('road')}`, `المنزل: ${form.get('building')}`] : []),
      '', 'الطلب:', '',
      ...cart.items.flatMap((item) => [`${item.quantity} × ${item.name}`, Object.values(item.options).filter(Boolean).join(' / '), `السعر: ${formatOrderAmount(amountToFils(item.price) * item.quantity, locale)}`, '']),
      `المجموع الفرعي: ${formatOrderAmount(subtotalFils, locale)}`, `التوصيل: ${formatOrderAmount(deliveryFils, locale)}`, `الإجمالي: ${formatOrderAmount(subtotalFils + deliveryFils, locale)}`
    ] : [
      'New order from 7Phone', '', `Name: ${form.get('name')}`, `Phone: ${form.get('phone')}`, `Method: ${method === 'delivery' ? 'Delivery' : 'Store pickup'}`,
      ...(method === 'delivery' ? ['', 'Address:', `Area: ${form.get('area')}`, `Block: ${form.get('block')}`, `Road: ${form.get('road')}`, `Building/House: ${form.get('building')}`] : []),
      '', 'Order:', '',
      ...cart.items.flatMap((item) => [`${item.quantity} × ${item.name}`, Object.entries(item.options).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(' / '), `Price: ${formatOrderAmount(amountToFils(item.price) * item.quantity, locale)}`, '']),
      `Subtotal: ${formatOrderAmount(subtotalFils, locale)}`, `Delivery: ${formatOrderAmount(deliveryFils, locale)}`, `Total: ${formatOrderAmount(subtotalFils + deliveryFils, locale)}`
    ];
    window.open(whatsappMessageUrl(settings.whatsapp, lines.filter((line, index) => line || lines[index - 1]).join('\n')), '_blank', 'noopener,noreferrer');
  }

  return <>
    <button aria-label={isAr ? `السلة، ${cart.count} منتجات` : `Cart, ${cart.count} items`} className="relative grid h-10 w-10 place-items-center rounded-full border border-[#ececec] bg-white text-[#111] transition hover:border-brand-neon" onClick={() => cart.setOpen(true)} type="button">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M7 9V7a5 5 0 0 1 10 0v2M5.5 9h13l-1 11h-11l-1-11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
      {cart.count ? <span className="absolute -end-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-brand-neon px-1 text-[10px] font-black text-white">{cart.count > 99 ? '99+' : cart.count}</span> : null}
    </button>
    {cart.open ? <div className="fixed inset-0 z-[100]" role="presentation">
      <button aria-label={isAr ? 'إغلاق السلة' : 'Close cart'} className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => cart.setOpen(false)} type="button" />
      <aside aria-label={isAr ? 'سلة التسوق' : 'Shopping cart'} aria-modal="true" className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-white text-[#111] shadow-2xl" role="dialog">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4"><div><h2 className="text-xl font-black">{isAr ? 'سلة التسوق' : 'Shopping Cart'}</h2><p className="mt-0.5 text-xs font-bold text-zinc-400">{cart.count} {isAr ? 'منتج' : cart.count === 1 ? 'item' : 'items'}</p></div><button className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-2xl" onClick={() => cart.setOpen(false)} type="button">×</button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!cart.items.length ? <div className="grid h-full place-items-center text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-zinc-100 text-2xl">♡</div><p className="mt-4 font-black">{isAr ? 'السلة فارغة' : 'Your cart is empty'}</p></div></div> : checkout ? <form className="grid gap-4" id="cart-checkout" onSubmit={submit}>
            <button className="w-fit text-sm font-black text-brand-neon" onClick={() => setCheckout(false)} type="button">{isAr ? '← العودة للسلة' : '← Back to cart'}</button>
            <h3 className="text-lg font-black">{isAr ? 'بيانات الطلب' : 'Order details'}</h3>
            <Field label={isAr ? 'الاسم' : 'Name'} name="name" /><Field label={isAr ? 'رقم الهاتف' : 'Phone'} name="phone" type="tel" />
            <fieldset><legend className="mb-2 text-sm font-black">{isAr ? 'طريقة الاستلام' : 'Order method'}</legend><div className="grid grid-cols-2 gap-2"><Choice active={method === 'pickup'} label={isAr ? 'استلام من المحل' : 'Store pickup'} onClick={() => setMethod('pickup')} /><Choice active={method === 'delivery'} label={isAr ? 'توصيل' : 'Delivery'} onClick={() => setMethod('delivery')} /></div></fieldset>
            {method === 'delivery' ? <div className="grid grid-cols-2 gap-3"><Field label={isAr ? 'المنطقة' : 'Area'} name="area" /><Field label={isAr ? 'المجمع' : 'Block'} name="block" /><Field label={isAr ? 'الطريق' : 'Road'} name="road" /><Field label={isAr ? 'المنزل' : 'Building/House'} name="building" /></div> : null}
            {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
          </form> : <div className="divide-y divide-zinc-200">{cart.items.map((item) => <div className="flex gap-3 py-4 first:pt-0" key={item.key}><div className="h-20 w-20 shrink-0 rounded-xl bg-zinc-50 p-2"><FallbackImage alt={item.name} className="h-full w-full object-contain" src={item.image}><div /></FallbackImage></div><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-sm font-black">{item.name}</h3><p className="mt-1 text-xs font-semibold text-zinc-500">{Object.values(item.options).filter(Boolean).join(' / ')}</p><p className="mt-2 text-sm font-black text-brand-neon">{formatOrderAmount(amountToFils(item.price), locale)}</p><div className="mt-2 flex items-center justify-between"><div className="flex items-center rounded-full border border-zinc-200"><button className="h-8 w-8" onClick={() => cart.setQuantity(item.key, item.quantity - 1)} type="button">−</button><span className="min-w-7 text-center text-xs font-black">{item.quantity}</span><button className="h-8 w-8" onClick={() => cart.setQuantity(item.key, item.quantity + 1)} type="button">+</button></div><button className="text-xs font-bold text-zinc-400 underline" onClick={() => cart.removeItem(item.key)} type="button">{isAr ? 'إزالة' : 'Remove'}</button></div></div></div>)}</div>}
        </div>
        {cart.items.length ? <div className="border-t border-zinc-200 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"><div className="grid gap-2 text-sm"><Total label={isAr ? 'المجموع الفرعي' : 'Subtotal'} value={formatOrderAmount(subtotalFils, locale)} /><Total label={isAr ? 'التوصيل' : 'Delivery'} value={formatOrderAmount(deliveryFils, locale)} /><Total strong label={isAr ? 'الإجمالي' : 'Total'} value={formatOrderAmount(subtotalFils + deliveryFils, locale)} /></div><button className="mt-4 min-h-12 w-full rounded-full bg-brand-neon px-5 font-black text-white shadow-lg shadow-brand-neon/20" form={checkout ? 'cart-checkout' : undefined} onClick={checkout ? undefined : () => setCheckout(true)} type={checkout ? 'submit' : 'button'}>{checkout ? (isAr ? 'إرسال الطلب عبر واتساب' : 'Send order via WhatsApp') : (isAr ? 'إتمام الطلب' : 'Checkout')}</button></div> : null}
      </aside>
    </div> : null}
  </>;
}

function Field({label, name, type = 'text'}: {label: string; name: string; type?: string}) { return <label className="grid gap-1.5 text-sm font-black">{label}<input className="h-12 rounded-xl border border-zinc-200 bg-white px-3 outline-none focus:border-brand-neon" name={name} type={type} /></label>; }
function Choice({active, label, onClick}: {active: boolean; label: string; onClick: () => void}) { return <button aria-pressed={active} className={`min-h-12 rounded-xl border px-3 text-sm font-black ${active ? 'border-brand-neon bg-brand-neon/5 text-brand-neon' : 'border-zinc-200'}`} onClick={onClick} type="button"><span className="me-2">{active ? '●' : '○'}</span>{label}</button>; }
function Total({label, value, strong}: {label: string; value: string; strong?: boolean}) { return <div className={`flex justify-between gap-4 ${strong ? 'mt-1 border-t border-zinc-200 pt-3 text-base font-black' : 'font-bold text-zinc-600'}`}><span>{label}</span><span>{value}</span></div>; }
