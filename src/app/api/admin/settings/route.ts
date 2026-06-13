import {NextResponse} from 'next/server';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, siteAssetsBucket, supabaseAdmin} from '@/lib/adminSupabase';
import {settingsToRecord} from '@/lib/settingsMap';
import type {StoreSettings} from '@/lib/types';

export const runtime = 'nodejs';

function jsonError(message: string, status: number) {
  return NextResponse.json({ok: false, message}, {status});
}

function dataUrlToBuffer(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/);

  if (!match) {
    return null;
  }

  const extensionByType: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg'
  };

  return {
    buffer: Buffer.from(match[2], 'base64'),
    contentType: match[1],
    extension: extensionByType[match[1]]
  };
}

async function persistAsset(name: string, value?: string | null) {
  if (!value || !value.startsWith('data:')) {
    return value || null;
  }

  const asset = dataUrlToBuffer(value);

  if (!asset || !supabaseAdmin) {
    return value;
  }

  const path = `${name}-${Date.now()}.${asset.extension}`;
  const {error} = await supabaseAdmin.storage
    .from(siteAssetsBucket)
    .upload(path, asset.buffer, {
      contentType: asset.contentType,
      cacheControl: '31536000',
      upsert: true
    });

  if (error) {
    throw new Error(error.message);
  }

  const {data} = supabaseAdmin.storage.from(siteAssetsBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin storage is not configured.', 503);
  }

  const body = (await request.json().catch(() => null)) as (StoreSettings & {
    paymentOptions?: string;
    deliveryOptions?: string;
    whatsappTemplate?: string;
  }) | null;

  if (!body) {
    return jsonError('Invalid settings payload.', 400);
  }

  try {
    const nextSettings = {
      ...body,
      logoUrl: await persistAsset('logo', body.logoUrl),
      bannerUrl: await persistAsset('banner', body.bannerUrl)
    };

    const {data, error} = await supabaseAdmin
      .from('store_settings')
      .upsert(settingsToRecord(nextSettings), {onConflict: 'id'})
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      ok: true,
      settings: {
        ...nextSettings,
        logoUrl: data.logo_url ?? nextSettings.logoUrl,
        bannerUrl: data.banner_url ?? nextSettings.bannerUrl
      }
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Could not save settings.', 500);
  }
}
