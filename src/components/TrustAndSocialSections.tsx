import type {Locale} from '@/lib/types';

type IconName = 'calendar' | 'shield' | 'truck' | 'card';
type SocialIconName = 'instagram' | 'youtube' | 'tiktok' | 'snapchat';

function FeatureIcon({name}: {name: IconName}) {
  const common = {fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8};
  if (name === 'calendar') return <svg aria-hidden className="h-7 w-7" viewBox="0 0 24 24"><rect {...common} x="3" y="5" width="18" height="16" rx="3"/><path {...common} d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/></svg>;
  if (name === 'shield') return <svg aria-hidden className="h-7 w-7" viewBox="0 0 24 24"><path {...common} d="M12 3 20 6v5c0 5.1-3.2 8.4-8 10-4.8-1.6-8-4.9-8-10V6l8-3Z"/><path {...common} d="m8.5 12 2.2 2.2 4.8-5"/></svg>;
  if (name === 'truck') return <svg aria-hidden className="h-7 w-7" viewBox="0 0 24 24"><path {...common} d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle {...common} cx="7" cy="18" r="2"/><circle {...common} cx="18" cy="18" r="2"/></svg>;
  return <svg aria-hidden className="h-7 w-7" viewBox="0 0 24 24"><rect {...common} x="3" y="5" width="18" height="14" rx="3"/><path {...common} d="M3 10h18M7 15h4"/></svg>;
}

function SocialPlatformIcon({name}: {name: SocialIconName}) {
  if (name === 'instagram') return <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24"><rect fill="none" height="16" rx="4.5" stroke="currentColor" strokeWidth="2" width="16" x="4" y="4"/><circle cx="12" cy="12" fill="none" r="3.5" stroke="currentColor" strokeWidth="2"/><circle cx="17.35" cy="6.75" fill="currentColor" r="1"/></svg>;
  if (name === 'youtube') return <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24"><path fill="currentColor" d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.7 12 4.7 12 4.7s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"/></svg>;
  if (name === 'tiktok') return <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24"><path fill="currentColor" d="M15.2 3c.3 2.5 1.7 4 4.2 4.2v3.1a8.5 8.5 0 0 1-4.2-1.2v6.2a6.3 6.3 0 1 1-5.4-6.2v3.2a3.2 3.2 0 1 0 2.3 3V3h3.1Z"/></svg>;
  return <svg aria-hidden className="h-6 w-6" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3c3 0 4.8 2.3 4.8 5.2 0 1.6.5 2.8 2.2 3.7-.4 1-1.2 1.5-2.3 1.7-.2 1.8-1.7 2.2-3.2 2.3-.4.7-.8 1.6-1.5 2.7-.7-1.1-1.1-2-1.5-2.7-1.5-.1-3-.5-3.2-2.3-1.1-.2-1.9-.7-2.3-1.7 1.7-.9 2.2-2.1 2.2-3.7C7.2 5.3 9 3 12 3Z"/></svg>;
}

function BrandMark({kind}: {kind: 'seven' | 'i7'}) {
  return kind === 'seven'
    ? <img alt="7Phone" className="h-11 w-11 rounded-xl object-contain" src="/images/7phone-logo.svg" />
    : <span aria-label="i7" className="text-2xl font-black tracking-tight text-[#111111]">i<span className="text-brand-neon">7</span></span>;
}

const trustCards = {
  ar: [
    {icon: 'calendar' as const, title: 'خبرة منذ 2007', description: 'أكثر من 18 عاماً من الخبرة في بيع الهواتف والأجهزة الذكية.'},
    {icon: 'shield' as const, title: 'ضمان حقيقي', description: 'جميع الأجهزة الجديدة مع ضمان رسمي وخدمة ما بعد البيع.'},
    {icon: 'truck' as const, title: 'توصيل سريع', description: 'توصيل لجميع مناطق البحرين مقابل 2 د.ب خلال ساعات.'},
    {icon: 'card' as const, title: 'طرق دفع متعددة', description: 'BenefitPay\nبطاقات الدفع\nالدفع عند الاستلام'},
    {brand: 'i7' as const, title: 'مركز صيانة i7', description: 'صيانة احترافية وقطع أصلية لمعظم الأجهزة.'}
  ],
  en: [
    {icon: 'calendar' as const, title: 'Experience Since 2007', description: 'More than 18 years of experience selling phones and smart devices.'},
    {icon: 'shield' as const, title: 'Genuine Warranty', description: 'Every new device includes official warranty and after-sales support.'},
    {icon: 'truck' as const, title: 'Fast Delivery', description: 'Delivery across Bahrain for BHD 2 within hours.'},
    {icon: 'card' as const, title: 'Multiple Payment Methods', description: 'BenefitPay\nPayment Cards\nCash on Delivery'},
    {brand: 'i7' as const, title: 'i7 Service Center', description: 'Professional repairs and genuine parts for most devices.'}
  ]
};

const socialCards = {
  ar: [
    {platform: 'Instagram', username: '@7phone', description: 'أحدث العروض والأجهزة الجديدة والإعلانات اليومية.', href: 'https://instagram.com/7phone', icon: 'instagram' as const},
    {platform: 'i7 Service', username: '@i7.bh', description: 'صيانة الهواتف قبل وبعد الإصلاح ونصائح فنية.', href: 'https://instagram.com/i7.bh', icon: 'instagram' as const},
    {platform: 'YouTube', username: '@7phone7', description: 'مراجعات وتجارب عملية للهواتف والأجهزة الذكية.', href: 'https://youtube.com/@7phone7', icon: 'youtube' as const},
    {platform: 'TikTok', username: '@7phone', description: 'فيديوهات قصيرة عن أحدث الأجهزة والعروض.', href: 'https://tiktok.com/@7phone', icon: 'tiktok' as const},
    {platform: 'Snapchat', username: 'seven.bh', description: 'تغطيات يومية وعروض فورية.', href: 'https://snapchat.com/add/seven.bh', icon: 'snapchat' as const},
    {platform: 'Website', username: '7phone.app', description: 'تصفح جميع المنتجات والعروض الحصرية.', href: 'https://7phone.app', brand: 'seven' as const}
  ],
  en: [
    {platform: 'Instagram', username: '@7phone', description: 'Latest offers, new devices, and daily announcements.', href: 'https://instagram.com/7phone', icon: 'instagram' as const},
    {platform: 'i7 Service', username: '@i7.bh', description: 'Phone repairs, before-and-after results, and technical advice.', href: 'https://instagram.com/i7.bh', icon: 'instagram' as const},
    {platform: 'YouTube', username: '@7phone7', description: 'Hands-on reviews of phones and smart devices.', href: 'https://youtube.com/@7phone7', icon: 'youtube' as const},
    {platform: 'TikTok', username: '@7phone', description: 'Short videos featuring the latest devices and offers.', href: 'https://tiktok.com/@7phone', icon: 'tiktok' as const},
    {platform: 'Snapchat', username: 'seven.bh', description: 'Daily coverage and instant offers.', href: 'https://snapchat.com/add/seven.bh', icon: 'snapchat' as const},
    {platform: 'Website', username: '7phone.app', description: 'Browse every product and exclusive offer.', href: 'https://7phone.app', brand: 'seven' as const}
  ]
};

const trustStats = {
  ar: ['👥 +100,000 عميل راضٍ', '📦 +250,000 طلب تم توصيله', '🛡️ ضمان رسمي', '🚚 توصيل لجميع مناطق البحرين', '⭐ متجر بحريني موثوق منذ 2007'],
  en: ['👥 100,000+ Happy Customers', '📦 250,000+ Orders Delivered', '🛡️ Official Warranty', '🚚 Delivery Across Bahrain', '⭐ Trusted Bahraini Store Since 2007']
};

export function TrustAndSocialSections({locale}: {locale: Locale}) {
  const isArabic = locale === 'ar';
  return (
    <div className="bg-[#f5f5f7] px-4 pb-20 pt-8 text-[#111111]" dir={isArabic ? 'rtl' : 'ltr'}>
      <section aria-labelledby="why-seven-title" className="mx-auto max-w-7xl">
        <div className="mb-8 text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-brand-neon">7PHONE BAHRAIN</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl" id="why-seven-title">{isArabic ? 'لماذا 7Phone؟' : 'Why 7Phone?'}</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {trustCards[locale].map((card) => <article className="group rounded-[20px] border border-[#ececec] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-[3px] hover:scale-[1.03] hover:border-brand-neon hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]" key={card.title}><span className="grid h-14 w-14 place-items-center rounded-full bg-[#f5f5f7] text-[#666666] transition-colors group-hover:text-brand-neon">{card.brand ? <BrandMark kind="i7" /> : <FeatureIcon name={card.icon!} />}</span><h3 className="mt-5 text-lg font-black leading-7">{card.title}</h3><p className="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-[#666666]">{card.description}</p></article>)}
        </div>
      </section>

      <section aria-labelledby="follow-seven-title" className="mx-auto mt-20 max-w-3xl px-1 sm:px-6">
        <div className="mb-8 text-center"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-neon">STAY CONNECTED</p><h2 className="mt-2.5 text-2xl font-black tracking-tight md:text-[30px]" id="follow-seven-title">{isArabic ? 'تابعنا على جميع المنصات' : 'Follow Us Everywhere'}</h2></div>
        <div className="divide-y divide-[#e8e8e8]">
          {socialCards[locale].map((social) => <a aria-label={`${social.platform} ${social.username}`} className="group flex min-h-[72px] items-center gap-4 px-1 py-3 text-[#111111] transition-colors duration-200 hover:bg-black/[.025] focus-visible:bg-black/[.025] focus-visible:outline-none sm:min-h-[76px] sm:px-4" href={social.href} key={`${social.platform}-${social.username}`} rel="noreferrer" target={social.platform === 'Website' ? undefined : '_blank'}><span className="grid h-7 w-7 shrink-0 place-items-center text-black">{social.brand ? <img alt="7Phone" className="h-6 w-6 object-contain brightness-0" src="/images/7phone-logo.svg" /> : <SocialPlatformIcon name={social.icon!} />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold md:text-[15px]">{social.platform}</strong><span className="mt-0.5 block truncate text-xs font-medium text-[#777777]" dir="ltr">{social.username}</span></span><span aria-hidden className={`shrink-0 text-base font-light text-black transition duration-200 group-hover:text-brand-neon ${isArabic ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>{isArabic ? '←' : '→'}</span></a>)}
        </div>
        <div aria-label={isArabic ? 'إحصائيات الثقة' : 'Trust statistics'} className="mt-4 grid overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] sm:grid-cols-2 lg:grid-cols-5">
          {trustStats[locale].map((stat) => <div className="flex min-h-20 items-center justify-center border-b border-[#ececec] px-4 py-4 text-center text-sm font-black last:border-b-0 sm:border-e lg:border-b-0" key={stat}>{stat}</div>)}
        </div>
      </section>
    </div>
  );
}
