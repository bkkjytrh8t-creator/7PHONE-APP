'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import type {Locale} from '@/lib/types';
import {sanitizeProductContentBlocks, type ProductContentBlock} from '@/lib/productContent';
import {parseProductVideoUrl} from '@/lib/productMedia';

function widthClass(width: ProductContentBlock['width']) {
  if (width === 'small') return 'mx-auto max-w-2xl';
  if (width === 'medium') return 'mx-auto max-w-4xl';
  if (width === 'full') return 'w-full';
  return 'mx-auto max-w-6xl';
}

function videoSource(url: string) {
  const parsed = parseProductVideoUrl(url);
  if (parsed) return parsed;
  try {
    const value = new URL(url);
    const host = value.hostname.replace(/^www\./, '').toLowerCase();
    const parts = value.pathname.split('/').filter(Boolean);
    const id = host === 'vimeo.com' ? parts[0] : host === 'player.vimeo.com' && parts[0] === 'video' ? parts[1] : '';
    if (id && /^\d+$/.test(id)) return {source_type: 'vimeo', embed_url: `https://player.vimeo.com/video/${id}`, url};
  } catch {}
  return null;
}

function interactionEmbedUrl(source: string) {
  try {
    const url = new URL(source);
    url.searchParams.delete('autoplay');
    url.searchParams.delete('mute');
    return url.toString();
  } catch { return source; }
}

function FeatureVideo({block, src}: {block: ProductContentBlock; src: string}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) void video.play().catch(() => {});
      else video.pause();
    }, {threshold: [0, 0.2, 0.6]});
    observer.observe(video);
    return () => { observer.disconnect(); video.pause(); };
  }, [src]);
  if (failed) return null;
  return <video aria-label={block.caption || block.title || 'Product feature video'} className="aspect-video h-auto w-full rounded-[20px] bg-black object-contain" loop muted onError={() => setFailed(true)} playsInline poster={block.poster} preload="metadata" ref={ref} src={src} />;
}

function ImageMedia({block, compact = false}: {block: ProductContentBlock; compact?: boolean}) {
  const [failed, setFailed] = useState(false);
  if (!block.url || failed) return null;
  const alt = block.caption || block.title || '';
  return <figure className="min-w-0 overflow-hidden rounded-[20px] bg-[#f7f7f8]"><img alt={alt} className={`${compact ? 'aspect-square max-h-[520px]' : 'max-h-[900px]'} h-auto w-full object-contain`} decoding="async" loading="lazy" onError={() => setFailed(true)} src={block.url} />{block.caption ? <figcaption className="px-4 py-3 text-center text-sm font-semibold text-zinc-500">{block.caption}</figcaption> : null}</figure>;
}

function Media({block}: {block: ProductContentBlock}) {
  const alt = block.caption || block.title || '';
  if (block.type === 'video' || block.type === 'youtube') {
    const video = videoSource(block.url || '');
    if (!video) return null;
    if (video.source_type === 'mp4' || video.source_type === 'webm') return <FeatureVideo block={block} src={video.embed_url} />;
    return <iframe allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="aspect-video w-full rounded-[20px] border-0 bg-black" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={interactionEmbedUrl(video.embed_url)} title={alt || 'Product video'} />;
  }
  return <ImageMedia block={block} />;
}

function usefulBlocks(blocks: ProductContentBlock[]) {
  const seen = new Set<string>();
  const navigationNoise = /^(?:overview|tech specs?|learn more|buy|previous|next|home|menu|close|search(?:\s+[\w-]+)?)$/i;
  return blocks.filter((block) => {
    const copy = (block.title || block.text || '').trim();
    if ((block.type === 'heading' || block.type === 'text') && (!copy || navigationNoise.test(copy))) return false;
    if ((block.type === 'specifications' || block.type === 'feature_list') && !block.items?.some((item) => item.label || item.value)) return false;
    const signature = `${block.type}|${copy}|${block.url || ''}|${block.url2 || ''}`.toLowerCase();
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

type StoryItem = {kind: 'block'; block: ProductContentBlock} | {kind: 'images'; blocks: ProductContentBlock[]};

function storyItems(blocks: ProductContentBlock[]): StoryItem[] {
  const result: StoryItem[] = [];
  for (let index = 0; index < blocks.length;) {
    const block = blocks[index];
    const groupable = block.type === 'image' && block.width !== 'full';
    if (!groupable) { result.push({kind: 'block', block}); index += 1; continue; }
    const images: ProductContentBlock[] = [];
    while (index < blocks.length && blocks[index].type === 'image' && blocks[index].width !== 'full') images.push(blocks[index++]);
    result.push({kind: 'images', blocks: images});
  }
  return result;
}

export function ProductContentBlocks({blocks, locale, preview = false}: {blocks: unknown; locale: Locale; preview?: boolean}) {
  const story = useMemo(() => storyItems(usefulBlocks(sanitizeProductContentBlocks(blocks))), [blocks]);
  if (!story.length) return null;
  return <section className={preview ? 'grid gap-10 overflow-hidden' : 'mt-12 overflow-hidden rounded-[24px] border border-[#ececec] bg-white px-5 py-8 shadow-[0_8px_30px_rgba(0,0,0,.04)] md:px-10 md:py-12'} aria-label={locale === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}>
    {!preview ? <h2 className="mx-auto mb-12 max-w-6xl text-3xl font-black tracking-tight md:text-5xl">{locale === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}</h2> : null}
    <div className="grid min-w-0 gap-12 md:gap-20">
      {story.map((item, storyIndex) => {
        if (item.kind === 'images') {
          if (item.blocks.length === 1) return <div className="mx-auto w-full max-w-6xl" key={item.blocks[0].id}><ImageMedia block={item.blocks[0]} /></div>;
          const grid = item.blocks.length === 2 ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
          return <div className={`mx-auto grid w-full max-w-6xl gap-4 md:gap-6 ${grid}`} key={`image-group-${storyIndex}`}>{item.blocks.map((block) => <ImageMedia block={block} compact key={block.id} />)}</div>;
        }
        const block = item.block;
        const common = `${widthClass(block.width)} min-w-0`;
        if (block.type === 'divider') return <hr className="mx-auto w-full max-w-6xl border-[#ececec]" key={block.id} />;
        if (block.type === 'spacing') return <div aria-hidden className="h-4 md:h-8" key={block.id} />;
        if (block.type === 'heading') return <h3 className={`${common} text-3xl font-black leading-tight tracking-tight md:text-5xl`} key={block.id}>{block.title || block.text}</h3>;
        if (block.type === 'text') return <div className={`${common} whitespace-pre-line text-base font-medium leading-8 text-zinc-600 md:text-xl md:leading-9`} key={block.id}>{block.title ? <h3 className="mb-4 text-3xl font-black text-zinc-950">{block.title}</h3> : null}{block.text}</div>;
        if (block.type === 'feature_list') return <section className={common} key={block.id}>{block.title ? <h3 className="mb-6 text-3xl font-black">{block.title}</h3> : null}<ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{(block.items ?? []).map((entry, index) => <li className="border-b border-[#ececec] py-4 font-semibold" key={`${block.id}-${index}`}><b>{entry.label}</b>{entry.value ? <span className="mt-1 block text-zinc-600">{entry.value}</span> : null}</li>)}</ul></section>;
        if (block.type === 'specifications') return <section className={common} key={block.id}>{block.title ? <h3 className="mb-5 text-3xl font-black">{block.title}</h3> : null}<dl className="border-y border-[#ececec]">{(block.items ?? []).map((entry, index) => <div className="grid gap-1 border-b border-[#ececec] py-4 last:border-0 sm:grid-cols-[minmax(180px,.35fr)_1fr]" key={`${block.id}-${index}`}><dt className="font-black">{entry.label}</dt><dd className="text-zinc-600">{entry.value}</dd></div>)}</dl></section>;
        if (block.type === 'two_images') return <div className={`${common} grid gap-4 md:grid-cols-2 md:gap-6`} key={block.id}><ImageMedia block={{...block, type: 'image'}} compact />{block.url2 ? <ImageMedia block={{...block, id: `${block.id}-2`, type: 'image', url: block.url2, caption: ''}} compact /> : null}</div>;
        if (block.type === 'image_text' || block.type === 'text_image') return <section className={`${common} grid items-center gap-8 md:grid-cols-2 md:gap-14`} key={block.id}><div className={block.type === 'text_image' ? 'md:order-2' : ''}><ImageMedia block={{...block, type: block.url?.toLowerCase().includes('.gif') ? 'gif' : 'image'}} /></div><div><h3 className="text-3xl font-black leading-tight md:text-4xl">{block.title}</h3><p className="mt-5 whitespace-pre-line text-base font-medium leading-8 text-zinc-600 md:text-lg">{block.text}</p></div></section>;
        return <div className={common} key={block.id}><Media block={block} /></div>;
      })}
    </div>
  </section>;
}
