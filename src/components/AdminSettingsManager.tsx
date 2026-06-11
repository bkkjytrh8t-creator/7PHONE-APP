'use client';

import {useEffect, useState} from 'react';
import type {Locale, StoreSettings} from '@/lib/types';

const localLogoKey = '7phone-store-logo';
const localBannerKey = '7phone-store-banner';

function saveLocalImage(key: string, eventName: string, image: string) {
  try {
    if (image) {
      window.localStorage.setItem(key, image);
    } else {
      window.localStorage.removeItem(key);
    }

    window.dispatchEvent(new Event(eventName));
    return true;
  } catch {
    return false;
  }
}

function resizeImage(file: File, maxWidth: number, maxHeight: number) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error('Failed to load image.'));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Failed to prepare image.'));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

export function AdminSettingsManager({
  locale,
  settings
}: {
  locale: Locale;
  settings: StoreSettings;
}) {
  const copy = locale === 'ar'
    ? {
        title: 'إعدادات المتجر',
        payment: 'إعدادات الدفع',
        delivery: 'إعدادات التوصيل',
        content: 'محتوى الموقع',
        qr: 'BenefitPay QR',
        iban: 'نص IBAN',
        paymentOptions: 'خيارات الدفع',
        deliveryOptions: 'خيارات التوصيل',
        whatsappTemplate: 'قالب رسالة طلب واتساب',
        save: 'حفظ مؤقت',
        saved: 'تم الحفظ مؤقتاً في هذا المتصفح.',
        temporary: 'هذه الإعدادات مؤقتة داخل لوحة الإدارة ولا تغيّر الموقع العام حتى يتم ربط قاعدة بيانات.'
      }
    : {
        title: 'Store settings',
        payment: 'Payment Settings',
        delivery: 'Delivery Settings',
        content: 'Website Content',
        qr: 'BenefitPay QR',
        iban: 'IBAN text',
        paymentOptions: 'Payment options',
        deliveryOptions: 'Delivery options',
        whatsappTemplate: 'WhatsApp order message template',
        save: 'Save temporary',
        saved: 'Saved temporarily in this browser.',
        temporary: 'These settings are temporary inside admin and do not change the public site until a database is connected.'
      };
  const [logo, setLogo] = useState(settings.logoUrl ?? '');
  const [banner, setBanner] = useState(settings.bannerUrl ?? '');
  const [logoStatus, setLogoStatus] = useState('');
  const [bannerStatus, setBannerStatus] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');
  const [paymentOptions, setPaymentOptions] = useState('BenefitPay, Cash on delivery, Bank transfer');
  const [deliveryOptions, setDeliveryOptions] = useState('Delivery Bahrain, Store pickup');
  const [whatsappTemplate, setWhatsappTemplate] = useState('New order: {product} - {price} BHD - {storage} - {color}');
  const [iban, setIban] = useState(settings.iban);
  const [benefitPayQr, setBenefitPayQr] = useState(settings.benefitPayQr);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLogo(window.localStorage.getItem(localLogoKey) || settings.logoUrl || '');
    setBanner(window.localStorage.getItem(localBannerKey) || settings.bannerUrl || '');
    setPaymentOptions(window.localStorage.getItem('7phone-admin-payment-options') || paymentOptions);
    setDeliveryOptions(window.localStorage.getItem('7phone-admin-delivery-options') || deliveryOptions);
    setWhatsappTemplate(window.localStorage.getItem('7phone-admin-whatsapp-template') || whatsappTemplate);
    setIban(window.localStorage.getItem('7phone-admin-iban') || settings.iban);
    setBenefitPayQr(window.localStorage.getItem('7phone-admin-benefitpay-qr') || settings.benefitPayQr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.bannerUrl, settings.logoUrl]);

  async function onLogoChange(file: File | null) {
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setLogoStatus(locale === 'ar' ? 'جاري تجهيز اللوغو...' : 'Preparing logo...');

    try {
      const nextLogo = await resizeImage(file, 512, 512);
      setLogo(nextLogo);
      setLogoStatus(locale === 'ar' ? 'تم رفع اللوغو للمعاينة. اضغط حفظ اللوغو.' : 'Logo is ready. Press Save logo.');
    } catch {
      setLogoStatus(locale === 'ar' ? 'تعذر قراءة الصورة. جرّب صورة أخرى.' : 'Could not read the image. Try another file.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function onBannerChange(file: File | null) {
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setBannerStatus(locale === 'ar' ? 'جاري تجهيز البنر...' : 'Preparing banner...');

    try {
      const nextBanner = await resizeImage(file, 1600, 520);
      setBanner(nextBanner);
      setBannerStatus(locale === 'ar' ? 'تم رفع البنر للمعاينة. اضغط حفظ البنر.' : 'Banner is ready. Press Save banner.');
    } catch {
      setBannerStatus(locale === 'ar' ? 'تعذر قراءة البنر. جرّب صورة أخرى.' : 'Could not read the banner. Try another file.');
    } finally {
      setIsProcessing(false);
    }
  }

  function persistLogo() {
    const isSaved = saveLocalImage(localLogoKey, '7phone-logo-updated', logo);

    setLogoStatus(
      isSaved
        ? locale === 'ar'
          ? 'تم حفظ اللوغو بنجاح. افتح الصفحة الرئيسية وستراه في الأعلى.'
          : 'Logo saved. Open the home page to see it in the header.'
        : locale === 'ar'
          ? 'لم يتم الحفظ. جرّب صورة أصغر.'
          : 'Logo was not saved. Try a smaller image.'
    );
  }

  function persistBanner() {
    const isSaved = saveLocalImage(localBannerKey, '7phone-banner-updated', banner);

    setBannerStatus(
      isSaved
        ? locale === 'ar'
          ? 'تم حفظ البنر بنجاح. سيظهر أعلى الموقع.'
          : 'Banner saved. It will appear at the top of the site.'
        : locale === 'ar'
          ? 'لم يتم حفظ البنر. جرّب صورة أصغر.'
          : 'Banner was not saved. Try a smaller image.'
    );
  }

  function removeLogo() {
    setLogo('');
    const isSaved = saveLocalImage(localLogoKey, '7phone-logo-updated', '');
    setLogoStatus(
      isSaved
        ? locale === 'ar'
          ? 'تم حذف اللوغو.'
          : 'Logo removed.'
        : locale === 'ar'
          ? 'تعذر حذف اللوغو.'
          : 'Could not remove the logo.'
    );
  }

  function removeBanner() {
    setBanner('');
    const isSaved = saveLocalImage(localBannerKey, '7phone-banner-updated', '');
    setBannerStatus(
      isSaved
        ? locale === 'ar'
          ? 'تم حذف البنر.'
          : 'Banner removed.'
        : locale === 'ar'
          ? 'تعذر حذف البنر.'
          : 'Could not remove the banner.'
    );
  }

  const rows = [
    ['WhatsApp', settings.whatsapp],
    [locale === 'ar' ? 'هاتف المبيعات' : 'Sales phone', settings.phoneSales],
    [locale === 'ar' ? 'هاتف التصليح' : 'Repairs phone', settings.phoneRepairs],
    ['Instagram', settings.instagram],
    [locale === 'ar' ? 'رابط الموقع' : 'Site URL', settings.siteUrl]
  ];

  function saveTemporarySettings() {
    window.localStorage.setItem('7phone-admin-payment-options', paymentOptions);
    window.localStorage.setItem('7phone-admin-delivery-options', deliveryOptions);
    window.localStorage.setItem('7phone-admin-whatsapp-template', whatsappTemplate);
    window.localStorage.setItem('7phone-admin-iban', iban);
    window.localStorage.setItem('7phone-admin-benefitpay-qr', benefitPayQr);
    setSettingsStatus(copy.saved);
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-2xl font-black text-white">{copy.title}</h2>
        <p className="mt-2 text-sm font-semibold text-zinc-400">{copy.temporary}</p>

        <div className="mt-6 grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="grid h-44 place-items-center rounded-lg border border-white/10 bg-white/[0.03] p-4">
            {logo ? (
              <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/10">
                <img alt="Store logo preview" className="h-full w-full rounded-full object-cover" src={logo} />
              </div>
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-pink text-3xl font-black text-white">
                7
              </div>
            )}
          </div>

          <div className="grid content-start gap-3">
            <label className="grid gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm font-bold text-zinc-300">
              {locale === 'ar' ? 'رفع لوغو المتجر' : 'Upload store logo'}
              <input
                accept="image/*"
                disabled={isProcessing}
                onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-11 rounded-md bg-brand-neon px-5 text-sm font-black text-white"
                disabled={isProcessing || !logo}
                type="button"
                onClick={persistLogo}
              >
                {isProcessing
                  ? locale === 'ar'
                    ? 'جاري التجهيز'
                    : 'Preparing'
                  : locale === 'ar'
                    ? 'حفظ اللوغو'
                    : 'Save logo'}
              </button>
              <button
                className="h-11 rounded-md border border-white/10 px-5 text-sm font-black text-zinc-200"
                type="button"
                onClick={removeLogo}
              >
                {locale === 'ar' ? 'حذف اللوغو' : 'Remove logo'}
              </button>
            </div>
            <p className="text-xs font-semibold leading-5 text-zinc-500">
              {locale === 'ar'
                ? 'في وضع المعاينة يتم حفظ اللوغو في نفس المتصفح. عند ربط Supabase يمكن حفظه لكل الأجهزة.'
                : 'In preview mode the logo is saved in this browser. Connect Supabase to save it for all devices.'}
            </p>
            {logoStatus ? (
              <p className="rounded-md bg-white/5 px-4 py-3 text-sm font-bold text-zinc-200" role="status">
                {logoStatus}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-xl font-black text-white">
          {locale === 'ar' ? 'بنر أعلى الموقع' : 'Top site banner'}
        </h2>
        <div className="mt-5 grid gap-4">
          <div className="aspect-[40/13] overflow-hidden rounded-xl border border-zinc-800 bg-[#050506]">
            {banner ? (
              <img alt="Store banner preview" className="h-full w-full object-contain" src={banner} />
            ) : (
              <div className="grid h-full place-items-center text-sm font-black text-zinc-500">
                {locale === 'ar' ? 'معاينة البنر' : 'Banner preview'}
              </div>
            )}
          </div>
          <label className="grid gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm font-bold text-zinc-300">
            {locale === 'ar' ? 'رفع البنر' : 'Upload banner'}
            <input
              accept="image/*"
              disabled={isProcessing}
              onChange={(event) => onBannerChange(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="h-11 rounded-md bg-brand-neon px-5 text-sm font-black text-white"
              disabled={isProcessing || !banner}
              type="button"
              onClick={persistBanner}
            >
              {isProcessing
                ? locale === 'ar'
                  ? 'جاري التجهيز'
                  : 'Preparing'
                : locale === 'ar'
                  ? 'حفظ البنر'
                  : 'Save banner'}
            </button>
            <button
              className="h-11 rounded-md border border-white/10 px-5 text-sm font-black text-zinc-200"
              type="button"
              onClick={removeBanner}
            >
              {locale === 'ar' ? 'حذف البنر' : 'Remove banner'}
            </button>
          </div>
          <p className="text-xs font-semibold leading-5 text-zinc-500">
            {locale === 'ar'
              ? 'يفضل أن يكون البنر عريضًا بنسبة قريبة من 4:1 حتى يظهر مرتبًا أعلى الموقع.'
              : 'A wide banner around a 4:1 ratio will look best at the top of the site.'}
          </p>
          {bannerStatus ? (
            <p className="rounded-md bg-white/5 px-4 py-3 text-sm font-bold text-zinc-200" role="status">
              {bannerStatus}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-xl font-black text-white">{copy.payment}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-xs font-black uppercase text-zinc-400">
            {copy.qr}
            <input className="admin-input" onChange={(event) => setBenefitPayQr(event.target.value)} value={benefitPayQr} />
          </label>
          <label className="grid gap-2 text-xs font-black uppercase text-zinc-400">
            {copy.iban}
            <input className="admin-input" onChange={(event) => setIban(event.target.value)} value={iban} />
          </label>
        </div>
        <label className="grid gap-2 text-xs font-black uppercase text-zinc-400">
          {copy.paymentOptions}
          <textarea className="admin-textarea" onChange={(event) => setPaymentOptions(event.target.value)} value={paymentOptions} />
        </label>
      </section>

      <section className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-xl font-black text-white">{copy.delivery}</h2>
        <label className="grid gap-2 text-xs font-black uppercase text-zinc-400">
          {copy.deliveryOptions}
          <textarea className="admin-textarea" onChange={(event) => setDeliveryOptions(event.target.value)} value={deliveryOptions} />
        </label>
      </section>

      <section className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-xl font-black text-white">{copy.content}</h2>
        <label className="grid gap-2 text-xs font-black uppercase text-zinc-400">
          {copy.whatsappTemplate}
          <textarea className="admin-textarea" onChange={(event) => setWhatsappTemplate(event.target.value)} value={whatsappTemplate} />
        </label>
        <button className="h-11 w-fit rounded-md bg-brand-neon px-5 text-sm font-black text-white" onClick={saveTemporarySettings} type="button">
          {copy.save}
        </button>
        {settingsStatus ? <p className="rounded-md bg-brand-neon/10 px-4 py-3 text-sm font-bold text-pink-100">{settingsStatus}</p> : null}
      </section>

      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-xl font-black text-white">
          {locale === 'ar' ? 'بيانات التواصل' : 'Contact details'}
        </h2>
        <dl className="mt-5 grid gap-3">
          {rows.map(([key, value]) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4" key={key}>
              <dt className="text-xs font-black uppercase text-zinc-400">{key}</dt>
              <dd className="mt-1 break-words font-bold text-zinc-200">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
