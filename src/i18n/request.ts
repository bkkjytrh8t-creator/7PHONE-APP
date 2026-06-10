import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales, type Locale} from './routing';
import arMessages from './messages/ar.json';
import enMessages from './messages/en.json';

const messages: Record<Locale, Record<string, string>> = {
  ar: arMessages,
  en: enMessages
};

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: messages[locale as Locale],
    locale: locale as Locale
  };
});
