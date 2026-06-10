'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Locale} from '@/lib/types';

function getTodayEnd() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function getRemainingTime(target: Date) {
  const difference = Math.max(0, target.getTime() - Date.now());

  return {
    hours: Math.floor(difference / (1000 * 60 * 60)),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function OfferCountdown({
  locale,
  productName,
  priceText
}: {
  locale: Locale;
  productName: string;
  priceText: string;
}) {
  const target = useMemo(() => getTodayEnd(), []);
  const [remaining, setRemaining] = useState(() => getRemainingTime(target));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemainingTime(target));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [target]);

  const labels =
    locale === 'ar'
      ? {
          title: 'عرض اليوم',
          subtitle: 'ينتهي العرض خلال',
          hours: 'ساعة',
          minutes: 'دقيقة',
          seconds: 'ثانية'
        }
      : {
          title: 'Today offer',
          subtitle: 'Offer ends in',
          hours: 'Hours',
          minutes: 'Minutes',
          seconds: 'Seconds'
        };

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center text-white shadow-sm md:grid-cols-[1fr_auto] md:items-center md:text-start">
      <div>
        <div className="mx-auto w-fit rounded-md bg-brand-neon px-2.5 py-1 text-[11px] font-black text-white md:mx-0">
          {labels.title}
        </div>
        <h2 className="mt-2 text-xl font-black leading-tight md:text-2xl">{productName}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <span className="text-xs font-bold text-white/60">{labels.subtitle}</span>
          <strong className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-brand-pink">
            {priceText}
          </strong>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {[
          [pad(remaining.hours), labels.hours],
          [pad(remaining.minutes), labels.minutes],
          [pad(remaining.seconds), labels.seconds]
        ].map(([value, label]) => (
          <div className="min-w-14 rounded-xl bg-white px-2.5 py-2.5 text-center" key={label}>
            <div className="text-xl font-black leading-none text-brand-ink">{value}</div>
            <div className="mt-1 text-[10px] font-bold leading-none text-zinc-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
