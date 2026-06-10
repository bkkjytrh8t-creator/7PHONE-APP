import type {Locale, Product, StoreSettings} from '@/lib/types';
import {whatsappOrderUrl} from '@/lib/whatsapp';

export function WhatsAppButton({
  product,
  locale,
  settings,
  label,
  large = false
}: {
  product: Product;
  locale: Locale;
  settings: StoreSettings;
  label: string;
  large?: boolean;
}) {
  return (
    <a
      className={`inline-flex w-full items-center justify-center rounded-full bg-brand-whatsapp font-black text-white transition hover:brightness-95 ${
        large ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-xs'
      }`}
      href={whatsappOrderUrl(product, locale, settings)}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}
