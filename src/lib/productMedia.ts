import type {ProductMedia} from './types';

export type ParsedVideo = Pick<ProductMedia, 'media_type' | 'source_type' | 'url' | 'thumbnail_url'> & {
  embed_url: string;
};

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function youtubeId(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? '';
  if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return '';
  if (url.pathname === '/watch') return url.searchParams.get('v') ?? '';
  const parts = url.pathname.split('/').filter(Boolean);
  return ['shorts', 'embed', 'live'].includes(parts[0] ?? '') ? parts[1] ?? '' : '';
}

export function parseProductVideoUrl(value: string): ParsedVideo | null {
  const parsed = safeHttpsUrl(value);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const ytId = youtubeId(parsed);
  if (ytId && /^[a-zA-Z0-9_-]{6,20}$/.test(ytId)) {
    const canonicalUrl = new URL(`https://www.youtube.com/watch?v=${ytId}`);
    return {
      media_type: 'video',
      source_type: 'youtube',
      url: canonicalUrl.toString(),
      thumbnail_url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      embed_url: `https://www.youtube-nocookie.com/embed/${ytId}?controls=1&playsinline=1`
    };
  }

  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    const match = parsed.pathname.match(/\/video\/(\d+)/);
    if (!match) return null;
    parsed.search = '';
    return {
      media_type: 'video',
      source_type: 'tiktok',
      url: parsed.toString(),
      thumbnail_url: '',
      embed_url: `https://www.tiktok.com/player/v1/${match[1]}?autoplay=1&loop=0`
    };
  }

  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    const match = parsed.pathname.match(/^\/(reel|reels|p)\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    const kind = match[1] === 'p' ? 'p' : 'reel';
    const code = match[2];
    return {
      media_type: 'video',
      source_type: 'instagram',
      url: `https://www.instagram.com/${kind}/${code}/`,
      thumbnail_url: '',
      embed_url: `https://www.instagram.com/${kind}/${code}/embed/`
    };
  }

  const directType = parsed.pathname.toLowerCase().endsWith('.mp4')
    ? 'mp4'
    : parsed.pathname.toLowerCase().endsWith('.webm')
      ? 'webm'
      : null;
  if (directType) {
    parsed.search = '';
    return {
      media_type: 'video',
      source_type: directType,
      url: parsed.toString(),
      thumbnail_url: '',
      embed_url: parsed.toString()
    };
  }
  return null;
}

export function videoEmbedUrl(media: ProductMedia) {
  return media.media_type === 'video' ? parseProductVideoUrl(media.url)?.embed_url ?? '' : '';
}

export function mediaPlatformLabel(source: ProductMedia['source_type']) {
  if (source === 'youtube') return 'YouTube';
  if (source === 'tiktok') return 'TikTok';
  if (source === 'instagram') return 'Instagram Reel';
  if (source === 'mp4') return 'MP4';
  if (source === 'webm') return 'WebM';
  return source === 'upload' ? 'Upload' : 'External URL';
}
