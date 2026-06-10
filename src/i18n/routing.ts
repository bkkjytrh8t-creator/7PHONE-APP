export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const localeLabels: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English'
};
