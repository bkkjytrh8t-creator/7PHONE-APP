'use client';

import {useEffect, useState} from 'react';

const localBannerKey = '7phone-store-banner';

export function StoreBanner({bannerUrl}: {bannerUrl?: string | null}) {
  const [currentBanner, setCurrentBanner] = useState(bannerUrl ?? '');

  useEffect(() => {
    const readBanner = () => setCurrentBanner(window.localStorage.getItem(localBannerKey) || bannerUrl || '');

    readBanner();
    window.addEventListener('7phone-banner-updated', readBanner);
    return () => window.removeEventListener('7phone-banner-updated', readBanner);
  }, [bannerUrl]);

  if (!currentBanner) {
    return null;
  }

  return (
    <div className="bg-[#101014] px-3 py-3">
      <div
        aria-label="7Phone store banner"
        className="mx-auto aspect-[40/13] max-w-7xl overflow-hidden rounded-xl border border-white/10 bg-[#050506] bg-contain bg-center bg-no-repeat shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-brand-pink/20"
        role="img"
        style={{backgroundImage: `url(${currentBanner})`}}
      />
    </div>
  );
}
