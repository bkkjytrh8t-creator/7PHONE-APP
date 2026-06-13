import type {StoreSettings} from './types';

type SettingsRecord = Record<string, unknown>;

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function settingsFromRecord(record: SettingsRecord | null | undefined, fallback: StoreSettings): StoreSettings {
  if (!record) {
    return fallback;
  }

  return {
    logoUrl: stringValue(record.logo_url ?? record.logoUrl, fallback.logoUrl ?? ''),
    bannerUrl: stringValue(record.banner_url ?? record.bannerUrl, fallback.bannerUrl ?? '') || null,
    whatsapp: stringValue(record.whatsapp, fallback.whatsapp),
    phoneSales: stringValue(record.phone_sales ?? record.phoneSales, fallback.phoneSales),
    phoneRepairs: stringValue(record.phone_repairs ?? record.phoneRepairs, fallback.phoneRepairs),
    mapsUrl: stringValue(record.maps_url ?? record.mapsUrl, fallback.mapsUrl),
    instagram: stringValue(record.instagram, fallback.instagram),
    siteUrl: stringValue(record.site_url ?? record.siteUrl, fallback.siteUrl),
    benefitPayQr: stringValue(record.benefit_pay_qr ?? record.benefitPayQr, fallback.benefitPayQr),
    iban: stringValue(record.iban, fallback.iban)
  };
}

export function settingsToRecord(settings: StoreSettings & {
  paymentOptions?: string;
  deliveryOptions?: string;
  whatsappTemplate?: string;
}) {
  return {
    id: 'main',
    logo_url: settings.logoUrl || null,
    banner_url: settings.bannerUrl || null,
    whatsapp: settings.whatsapp,
    phone_sales: settings.phoneSales,
    phone_repairs: settings.phoneRepairs,
    maps_url: settings.mapsUrl,
    instagram: settings.instagram,
    site_url: settings.siteUrl,
    benefit_pay_qr: settings.benefitPayQr,
    iban: settings.iban,
    payment_options: settings.paymentOptions ?? null,
    delivery_options: settings.deliveryOptions ?? null,
    whatsapp_template: settings.whatsappTemplate ?? null,
    updated_at: new Date().toISOString()
  };
}
