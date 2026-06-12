'use client';

import {useEffect, useState} from 'react';
import {FallbackImage} from './FallbackImage';

const localLogoKey = '7phone-store-logo';

export function Logo({logoUrl}: {logoUrl?: string | null}) {
  const [currentLogo, setCurrentLogo] = useState(logoUrl ?? '');

  useEffect(() => {
    const readLogo = () => setCurrentLogo(window.localStorage.getItem(localLogoKey) || logoUrl || '');

    readLogo();
    window.addEventListener('7phone-logo-updated', readLogo);
    window.addEventListener('storage', readLogo);
    return () => {
      window.removeEventListener('7phone-logo-updated', readLogo);
      window.removeEventListener('storage', readLogo);
    };
  }, [logoUrl]);

  const fallbackLogo = (
    <svg aria-hidden viewBox="0 0 48 48" className="h-12 w-12">
      <rect width="48" height="48" rx="16" fill="#ffffff" />
      <rect x="5" y="5" width="38" height="38" rx="13" fill="#ff008c" />
      <path
        d="M16 14h18l-9.8 20.5"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M14 14h20"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/30">
        <FallbackImage
          alt="7Phone logo"
          className="h-full w-full rounded-full object-contain"
          src={currentLogo}
        >
          {fallbackLogo}
        </FallbackImage>
      </div>
      <div className="leading-tight">
        <div className="text-xl font-black tracking-normal text-white">7Phone</div>
        <div className="text-[12px] font-bold tracking-normal text-white/68">سفن فون · Bahrain</div>
      </div>
    </div>
  );
}
