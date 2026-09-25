'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {formatPrice} from '@/lib/format';
import type {Locale} from '@/lib/types';
import {parseProductVideoUrl} from '@/lib/productMedia';

type YouTubePlayer = {
  destroy: () => void;
  mute: () => void;
  playVideo: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLIFrameElement, options: {
        events: {
          onReady: (event: {target: YouTubePlayer}) => void;
          onStateChange: (event: {data: number}) => void;
          onError: () => void;
        };
      }) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === 'undefined' || window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise<void>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

export type HeroSlide = {
  id: string;
  desktopImage: string;
  mobileImage?: string;
  desktopMediaType?: 'image' | 'video' | 'youtube';
  mobileMediaType?: 'image' | 'video' | 'youtube';
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  oldPrice: number | null;
  price: number | null;
  ctaAr: string;
  ctaEn: string;
  href: string;
  enabled: boolean;
  displayOrder: number;
};

function youtubeMedia(value: string) {
  const parsed = parseProductVideoUrl(value);
  if (parsed?.source_type !== 'youtube') return null;
  const id = new URL(parsed.url).searchParams.get('v') || '';
  return {
    embed: `${parsed.embed_url}&controls=0&loop=1&playlist=${encodeURIComponent(id)}&rel=0&modestbranding=1&disablekb=1&enablejsapi=1`,
    poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  };
}

function HeroVideo({label, type, url}: {label: string; type: 'video' | 'youtube'; url: string}) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(type === 'video');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtube = type === 'youtube' ? youtubeMedia(url) : null;

  useEffect(() => {
    if (!youtube || !iframeRef.current) return;
    let disposed = false;
    let player: YouTubePlayer | null = null;
    void loadYouTubeApi().then(() => {
      if (disposed || !iframeRef.current || !window.YT?.Player) return;
      player = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: ({target}) => {
            target.mute();
            target.playVideo();
          },
          onStateChange: ({data}) => {
            if (data === 1) setPlaying(true);
          },
          onError: () => setFailed(true)
        }
      });
    });
    return () => {
      disposed = true;
      player?.destroy();
    };
  }, [youtube?.embed]);

  useEffect(() => {
    if (type !== 'video') return;
    const video = videoRef.current;
    video?.play().catch(() => setPlaying(false));
  }, [type, url]);

  return <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-900">
    {youtube ? <img alt="" aria-hidden className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${playing ? 'opacity-0' : 'opacity-100'}`} decoding="async" fetchPriority="high" loading="eager" src={youtube.poster} /> : <div className="absolute inset-0 bg-zinc-900" />}
    {!failed && youtube ? <iframe allow="autoplay; encrypted-media; picture-in-picture" aria-label={label} className={`pointer-events-none absolute inset-0 z-10 h-full w-full scale-[2.25] border-0 transition-opacity duration-500 ease-out md:scale-[1.3] ${playing ? 'opacity-100' : 'opacity-0'}`} loading="eager" onError={() => setFailed(true)} ref={iframeRef} referrerPolicy="strict-origin-when-cross-origin" src={youtube.embed} title={label} /> : null}
    {!failed && type === 'video' ? <video aria-label={label} autoPlay className="absolute inset-0 z-10 h-full w-full object-cover object-center" loop muted onCanPlay={(event) => { event.currentTarget.play().catch(() => setPlaying(false)); }} onError={() => setFailed(true)} playsInline ref={videoRef} src={url} /> : null}
  </div>;
}

export function HeroSlider({slides, locale}: {slides: HeroSlide[]; locale: Locale}) {
  const enabledSlides = useMemo(() => slides.filter((slide) => slide.enabled).sort((a, b) => a.displayOrder - b.displayOrder), [slides]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStart = useRef<number | null>(null);
  const isArabic = locale === 'ar';

  useEffect(() => {
    if (active >= enabledSlides.length) setActive(0);
  }, [active, enabledSlides.length]);

  useEffect(() => {
    if (paused || enabledSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % enabledSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, [enabledSlides.length, paused]);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  if (!enabledSlides.length) return null;

  function move(direction: number) {
    setActive((index) => (index + direction + enabledSlides.length) % enabledSlides.length);
  }

  return (
    <div className="bg-[#f5f5f7] px-4 pb-14 pt-8 sm:px-5 lg:px-10 lg:pb-14 xl:px-14">
    <section
      aria-label={isArabic ? 'العروض الرئيسية' : 'Featured offers'}
      aria-roledescription="carousel"
      className="relative mx-auto aspect-[4/5] w-full max-w-7xl overflow-hidden rounded-[28px] bg-white text-[#111111] md:aspect-[16/7] md:max-h-[520px] md:rounded-[32px]"
      dir="ltr"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(delta) > 45) move(delta > 0 ? (isArabic ? 1 : -1) : (isArabic ? -1 : 1));
        touchStart.current = null;
      }}
    >
      {enabledSlides.map((slide, index) => {
        const visible = index === active;
        const title = isArabic ? slide.titleAr : slide.titleEn;
        const subtitle = isArabic ? slide.subtitleAr : slide.subtitleEn;
        const cta = isArabic ? slide.ctaAr : slide.ctaEn;
        const hasOverlayContent = Boolean(title || subtitle || cta || slide.price !== null);
        const mediaUrl = isMobile && slide.mobileImage ? slide.mobileImage : slide.desktopImage;
        const mediaType = isMobile && slide.mobileImage ? slide.mobileMediaType || slide.desktopMediaType : slide.desktopMediaType;
        const directVideo = mediaType === 'video' || /\.(mp4|webm)(?:\?|$)/i.test(mediaUrl);
        const youtube = mediaType === 'youtube' || Boolean(youtubeMedia(mediaUrl));
        const videoSlide = youtube || directVideo;
        return (
          <article
            aria-hidden={!visible}
            className={`absolute inset-0 bg-white transition-opacity duration-500 ease-out motion-reduce:transition-none ${visible ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
            key={slide.id}
          >
            {videoSlide ? <HeroVideo key={`${slide.id}-${isMobile ? 'mobile' : 'desktop'}`} label={title || (isArabic ? 'فيديو العرض' : 'Hero video')} type={youtube ? 'youtube' : 'video'} url={mediaUrl} /> : null}
            <div className="relative mx-auto grid h-full max-w-7xl grid-rows-[230px_1fr] px-6 pb-12 pt-6 sm:grid-rows-[255px_1fr] sm:px-10 lg:grid-cols-[55%_45%] lg:grid-rows-1 lg:gap-10 lg:px-16 lg:py-10">
              <div className="relative col-start-1 row-start-1 grid min-h-0 min-w-0 place-items-center lg:h-full">
                {!videoSlide ? <img alt={isArabic ? slide.titleAr : slide.titleEn} className="absolute inset-0 h-full w-full object-contain object-center" decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} src={mediaUrl} /> : null}
              </div>
              {hasOverlayContent ? <div className={`relative z-10 col-start-1 row-start-2 flex min-w-0 flex-col items-start justify-center lg:col-start-2 lg:row-start-1 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                {title ? <h1 className="mt-1.5 min-h-[54px] line-clamp-2 w-full text-2xl font-black leading-[1.12] tracking-tight lg:mt-3 lg:min-h-[90px] lg:text-4xl xl:text-[42px]">{title}</h1> : null}
                {subtitle ? <p className="mt-2 min-h-10 line-clamp-2 w-full max-w-lg text-xs font-semibold leading-5 text-[#666666] lg:mt-3 lg:min-h-12 lg:text-sm lg:leading-6">{subtitle}</p> : null}
                {slide.price !== null ? <div className="mt-3 flex min-h-8 w-full flex-wrap items-baseline gap-2 lg:mt-4">
                  <strong className="text-2xl font-black tracking-tight text-brand-neon lg:text-3xl">{formatPrice(slide.price, locale)}</strong>
                  {slide.oldPrice && slide.oldPrice > slide.price ? <span className="text-xs font-bold text-[#999999] line-through lg:text-sm">{formatPrice(slide.oldPrice, locale)}</span> : null}
                </div> : <div className="mt-3 min-h-8 lg:mt-4" />}
                {cta ? <a className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-brand-neon px-5 text-xs font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0 lg:mt-5 lg:h-12 lg:px-7 lg:text-sm" href={slide.href} tabIndex={visible ? 0 : -1}>{cta}</a> : null}
              </div> : null}
            </div>
          </article>
        );
      })}
      {enabledSlides.length > 1 ? <>
        <button aria-label={isArabic ? 'الشريحة السابقة' : 'Previous slide'} className="absolute start-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#e5e5e5] bg-white/90 text-xl text-[#111111] shadow-sm transition hover:border-brand-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon lg:grid" onClick={() => move(isArabic ? 1 : -1)} type="button">‹</button>
        <button aria-label={isArabic ? 'الشريحة التالية' : 'Next slide'} className="absolute end-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#e5e5e5] bg-white/90 text-xl text-[#111111] shadow-sm transition hover:border-brand-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon lg:grid" onClick={() => move(isArabic ? -1 : 1)} type="button">›</button>
        <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:bottom-4" role="tablist" aria-label={isArabic ? 'شرائح العرض' : 'Offer slides'}>
          {enabledSlides.map((slide, index) => <button aria-label={`${isArabic ? 'انتقل إلى الشريحة' : 'Go to slide'} ${index + 1}`} aria-selected={active === index} className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon ${active === index ? 'w-7 bg-brand-neon' : 'w-2.5 bg-black/20'}`} key={slide.id} onClick={() => setActive(index)} role="tab" type="button" />)}
        </div>
      </> : null}
    </section>
    </div>
  );
}
