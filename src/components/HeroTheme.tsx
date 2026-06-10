'use client';

import {useEffect, useState} from 'react';
import {Logo} from './Logo';

const localBannerKey = '7phone-store-banner';

export function HeroTheme({
  bannerUrl,
  logoUrl,
  title,
  subtitle
}: {
  bannerUrl?: string | null;
  logoUrl?: string | null;
  title: string;
  subtitle: string;
}) {
  const [currentBanner, setCurrentBanner] = useState(bannerUrl ?? '');

  useEffect(() => {
    const readBanner = () => setCurrentBanner(window.localStorage.getItem(localBannerKey) || bannerUrl || '');

    readBanner();
    window.addEventListener('7phone-banner-updated', readBanner);
    return () => window.removeEventListener('7phone-banner-updated', readBanner);
  }, [bannerUrl]);

  const backgroundImage = currentBanner || '/images/7phone-hero.png';

  return (
    <section className="bg-[#101014] text-white">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 pt-6 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8">
        <div className="min-w-0">
          <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Logo logoUrl={logoUrl} />
          </div>
          <h1 className="text-4xl font-black tracking-normal md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">{subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white/76">
            <span className="rounded-lg border border-white/12 px-3 py-2">Genuine & sealed</span>
            <span className="rounded-lg border border-white/12 px-3 py-2">Bahrain warranty</span>
            <span className="rounded-lg border border-white/12 px-3 py-2">Repair workshop</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050506] p-2 shadow-[0_18px_48px_rgba(0,0,0,0.38)] ring-1 ring-brand-pink/20">
          <div
            aria-label="7Phone store banner"
            className="aspect-[40/13] rounded-lg bg-contain bg-center bg-no-repeat"
            role="img"
            style={{backgroundImage: `url(${backgroundImage})`}}
          />
        </div>
      </div>
    </section>
  );
}
