import {NextResponse} from 'next/server';
import {getSettings} from '@/lib/data';
import {isSupabaseAdminConfigured, supabaseAdmin} from '@/lib/adminSupabase';
import {supabase} from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const settings = await getSettings();
  const client = isSupabaseAdminConfigured && supabaseAdmin ? supabaseAdmin : supabase;
  const rawResult = client ? await client.from('store_settings').select('*').eq('id', 'main').maybeSingle() : {data: null};
  const raw = rawResult.data && typeof rawResult.data === 'object'
    ? Object.fromEntries(Object.entries(rawResult.data).filter(([key]) => /benefit|payment|^data$|^settings$/.test(key.toLowerCase())))
    : null;
  return NextResponse.json({
    benefitpay_enabled: settings.benefitPayEnabled,
    benefitpay_qr_url: settings.benefitPayQr,
    benefitpay_instructions_ar: settings.benefitPayInstructionsAr,
    benefitpay_instructions_en: settings.benefitPayInstructionsEn,
    storage: raw
  }, {
    headers: {'Cache-Control': 'no-store'}
  });
}
