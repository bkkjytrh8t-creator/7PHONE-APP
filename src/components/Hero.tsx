import {getTranslations} from 'next-intl/server';
import {HeroTheme} from './HeroTheme';
import type {StoreSettings} from '@/lib/types';

export async function Hero({settings}: {settings: StoreSettings}) {
  const t = await getTranslations();

  return (
    <HeroTheme
      bannerUrl={settings.bannerUrl}
      logoUrl={settings.logoUrl}
      title={t('heroTitle')}
      subtitle={t('heroSubtitle')}
    />
  );
}
