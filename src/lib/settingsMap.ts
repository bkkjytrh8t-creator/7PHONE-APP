import type {StoreSettings} from './types';
import {normalizeBahrainWhatsappNumber} from './whatsapp';

type SettingsRecord = Record<string, unknown>;

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.trim().toLowerCase() === 'true' || value.trim() === '1') return true;
    if (value.trim().toLowerCase() === 'false' || value.trim() === '0') return false;
  }
  if (typeof value === 'number') return value === 1;
  return fallback;
}

function objectValue(value: unknown): SettingsRecord {
  if (value && typeof value === 'object') return value as SettingsRecord;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed as SettingsRecord : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function settingsFromRecord(record: SettingsRecord | null | undefined, fallback: StoreSettings): StoreSettings {
  if (!record) {
    return fallback;
  }

  const data = objectValue(record.data ?? record.settings);
  const payment = objectValue(record.payment_settings ?? data.payment_settings ?? data.payment ?? record.payment);
  const qr = record.benefit_pay_qr ?? record.benefitpay_qr_url ?? record.benefitpay_qr ?? record.benefitPayQr ?? data.benefitpay_qr_url ?? data.benefit_pay_qr ?? payment.benefitpay_qr_url ?? payment.benefit_pay_qr ?? payment.qrUrl ?? payment.qr_url;
  const enabled = record.benefit_pay_enabled ?? record.benefitpay_enabled ?? record.benefitPayEnabled ?? data.benefitpay_enabled ?? data.benefit_pay_enabled ?? payment.benefitpay_enabled ?? payment.benefit_pay_enabled ?? payment.enabled;
  const legacyPaymentOptions = stringValue(record.payment_options ?? data.paymentOptions, '');
  const legacyBenefitPayEnabled = Boolean(qr) && /benefit\s*pay/i.test(legacyPaymentOptions);

  return {
    logoUrl: stringValue(record.logo_url ?? record.logoUrl, fallback.logoUrl ?? ''),
    bannerUrl: stringValue(record.banner_url ?? record.bannerUrl, fallback.bannerUrl ?? '') || null,
    whatsapp: normalizeBahrainWhatsappNumber(stringValue(record.whatsapp, fallback.whatsapp)),
    phoneSales: stringValue(record.phone_sales ?? record.phoneSales, fallback.phoneSales),
    phoneRepairs: stringValue(record.phone_repairs ?? record.phoneRepairs, fallback.phoneRepairs),
    mapsUrl: stringValue(record.maps_url ?? record.mapsUrl, fallback.mapsUrl),
    instagram: stringValue(record.instagram, fallback.instagram),
    siteUrl: stringValue(record.site_url ?? record.siteUrl, fallback.siteUrl),
    benefitPayEnabled: booleanValue(enabled, legacyBenefitPayEnabled || fallback.benefitPayEnabled),
    benefitPayQr: stringValue(qr, fallback.benefitPayQr),
    benefitPayAccountHolder: stringValue(record.benefit_pay_account_holder ?? record.benefitPayAccountHolder, fallback.benefitPayAccountHolder),
    benefitPayPhone: stringValue(record.benefit_pay_phone ?? record.benefitPayPhone, fallback.benefitPayPhone),
    iban: stringValue(record.iban, fallback.iban),
    benefitPayInstructionsAr: stringValue(record.benefit_pay_instructions_ar ?? record.benefitpay_instructions_ar ?? record.benefitPayInstructionsAr ?? data.benefitpay_instructions_ar ?? data.benefit_pay_instructions_ar ?? payment.benefitpay_instructions_ar ?? payment.benefit_pay_instructions_ar ?? payment.instructions_ar, fallback.benefitPayInstructionsAr),
    benefitPayInstructionsEn: stringValue(record.benefit_pay_instructions_en ?? record.benefitpay_instructions_en ?? record.benefitPayInstructionsEn ?? data.benefitpay_instructions_en ?? data.benefit_pay_instructions_en ?? payment.benefitpay_instructions_en ?? payment.benefit_pay_instructions_en ?? payment.instructions_en, fallback.benefitPayInstructionsEn),
    paymentOptions: stringValue(record.payment_options ?? data.paymentOptions, ''),
    deliveryOptions: stringValue(record.delivery_options ?? data.deliveryOptions, ''),
    whatsappTemplate: stringValue(record.whatsapp_template ?? data.whatsappTemplate, '')
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
    whatsapp: normalizeBahrainWhatsappNumber(settings.whatsapp),
    phone_sales: settings.phoneSales,
    phone_repairs: settings.phoneRepairs,
    maps_url: settings.mapsUrl,
    instagram: settings.instagram,
    site_url: settings.siteUrl,
    benefit_pay_enabled: settings.benefitPayEnabled,
    benefitpay_enabled: settings.benefitPayEnabled,
    benefit_pay_qr: settings.benefitPayQr,
    benefitpay_qr_url: settings.benefitPayQr,
    benefit_pay_account_holder: settings.benefitPayAccountHolder,
    benefit_pay_phone: settings.benefitPayPhone,
    iban: settings.iban,
    benefit_pay_instructions_ar: settings.benefitPayInstructionsAr,
    benefit_pay_instructions_en: settings.benefitPayInstructionsEn,
    benefitpay_instructions_ar: settings.benefitPayInstructionsAr,
    benefitpay_instructions_en: settings.benefitPayInstructionsEn,
    payment_options: settings.paymentOptions ?? null,
    delivery_options: settings.deliveryOptions ?? null,
    whatsapp_template: settings.whatsappTemplate ?? null,
    updated_at: new Date().toISOString()
  };
}
