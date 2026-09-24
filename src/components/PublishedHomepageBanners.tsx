import type {HomepageSectionRow} from '@/lib/data';
import type {Locale} from '@/lib/types';
import {HeroSlider, type HeroSlide} from './HeroSlider';

const prefix = 'homepage-config:';
export type HomepageItemOverride = {name_ar?: string; name_en?: string; icon?: string; logo_url?: string; url?: string};
export type BannerConfig = {type?: string; description_ar?: string; description_en?: string; button_ar?: string; button_en?: string; destination_url?: string; desktop_image?: string; mobile_image?: string; desktop_media_type?: 'image' | 'video' | 'youtube'; mobile_media_type?: 'image' | 'video' | 'youtube'; price?: number | string; starts_at?: string; ends_at?: string; status?: string; item_ids?: Array<string | number>; hidden_item_ids?: Array<string | number>; item_overrides?: Record<string, HomepageItemOverride>};

export function configOf(section: HomepageSectionRow): BannerConfig | null {
  if (!section.source.startsWith(prefix)) return null;
  try { return JSON.parse(decodeURIComponent(section.source.slice(prefix.length))) as BannerConfig; } catch { return null; }
}

export function activeHomepageConfig(section: HomepageSectionRow, config: BannerConfig, requireMedia = false) {
  if (!section.is_visible || config.status === 'hidden' || (requireMedia && !config.desktop_image && !config.mobile_image)) return false;
  const now = Date.now(), start = config.starts_at ? Date.parse(config.starts_at) : NaN, end = config.ends_at ? Date.parse(config.ends_at) : NaN;
  if (Number.isFinite(start) && now < start) return false;
  if (Number.isFinite(end) && now > end) return false;
  return true;
}

function safeHref(value?: string) {
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''; } catch { return ''; }
}

export function managedHomepageHeroExists(sections: HomepageSectionRow[]) {
  return sections.some((section) => { const config = configOf(section); return Boolean(config && config.type === 'hero' && activeHomepageConfig(section, config, true)); });
}

export function PublishedHomepageBanners({sections, locale, placement}: {sections: HomepageSectionRow[]; locale: Locale; placement: 'hero' | 'secondary'}) {
  const banners = sections.flatMap((section) => { const config = configOf(section); if (!config || !activeHomepageConfig(section, config, true)) return []; const hero = config.type === 'hero'; if ((placement === 'hero') !== hero || !['hero', 'small_banner', 'image_slider', 'image_text', 'custom'].includes(config.type || '')) return []; return [{section, config}]; });
  if (!banners.length) return null;
  if (placement === 'hero') {
    const slides: HeroSlide[] = banners.map(({section, config}, index) => {
      const titleAr = /^(?:الشاشة الرئيسية|البنر الرئيسي)$/i.test(section.title_ar.trim()) ? '' : section.title_ar;
      const titleEn = /^(?:main\s+hero|hero\s+banner|homepage|main\s+banner)$/i.test(section.title_en.trim()) ? '' : section.title_en;
      return ({
      id: section.id,
      desktopImage: config.desktop_image || config.mobile_image || '', mobileImage: config.mobile_image || config.desktop_image,
      desktopMediaType: config.desktop_media_type || config.mobile_media_type || (/\.(mp4|webm)(?:\?|$)/i.test(config.desktop_image || config.mobile_image || '') ? 'video' : 'image'),
      mobileMediaType: config.mobile_media_type || config.desktop_media_type,
      titleAr, titleEn,
      subtitleAr: config.description_ar || '', subtitleEn: config.description_en || '',
      oldPrice: null, price: Number.isFinite(Number(config.price)) ? Number(config.price) : null,
      ctaAr: config.button_ar || '', ctaEn: config.button_en || '', href: safeHref(config.destination_url) || '#products',
      enabled: true, displayOrder: index
      });
    });
    return <HeroSlider locale={locale} slides={slides} />;
  }
  return <section className="bg-[#f5f5f7] px-4 py-6" aria-label={locale === 'ar' ? 'بنرات الصفحة الرئيسية' : 'Homepage banners'}>
    <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
      {banners.map(({section, config}) => {
        const title = locale === 'ar' ? section.title_ar : section.title_en;
        const description = locale === 'ar' ? config.description_ar : config.description_en;
        const button = locale === 'ar' ? config.button_ar : config.button_en;
        const media = config.desktop_media_type === 'video' || /\.(mp4|webm)(?:\?|$)/i.test(config.desktop_image || '')
          ? <video autoPlay className="absolute inset-0 h-full w-full object-cover" loop muted playsInline src={config.desktop_image} />
          : <picture><source media="(max-width: 767px)" srcSet={config.mobile_image || config.desktop_image} /><img alt={title || ''} className="absolute inset-0 h-full w-full object-cover" decoding="async" src={config.desktop_image} /></picture>;
        const content = <article className="relative isolate min-h-[190px] overflow-hidden rounded-[24px] border border-[#ececec] bg-white shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          {media}
          {(title || description || button) ? <><div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/65 to-transparent rtl:bg-gradient-to-l" /><div className="relative z-10 flex min-h-[inherit] max-w-[72%] flex-col justify-center p-6 md:max-w-[55%] md:p-12">{title ? <h2 className="text-2xl font-black leading-tight text-zinc-950 md:text-3xl">{title}</h2> : null}{description ? <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-zinc-600 md:text-lg">{description}</p> : null}{button ? <span className="mt-5 w-fit rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-black text-white">{button}</span> : null}</div></> : null}
        </article>;
        const href = safeHref(config.destination_url);
        return href ? <a href={href} key={section.id}>{content}</a> : <div key={section.id}>{content}</div>;
      })}
    </div>
  </section>;
}
