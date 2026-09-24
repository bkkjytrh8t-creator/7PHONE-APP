import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {hasAdminSession} from '@/lib/adminAuth';
import {isSupabaseAdminConfigured, productImagesBucket, supabaseAdmin} from '@/lib/adminSupabase';
import {settingsFromRecord, settingsToRecord} from '@/lib/settingsMap';
import type {StoreSettings} from '@/lib/types';

export const runtime = 'nodejs';

const emptySettings: StoreSettings = {
  logoUrl: '',
  bannerUrl: null,
  whatsapp: '',
  phoneSales: '',
  phoneRepairs: '',
  mapsUrl: '',
  instagram: '',
  siteUrl: '',
  benefitPayEnabled: false,
  benefitPayQr: '',
  benefitPayAccountHolder: '',
  benefitPayPhone: '',
  iban: '',
  benefitPayInstructionsAr: '',
  benefitPayInstructionsEn: '',
  paymentOptions: '',
  deliveryOptions: '',
  whatsappTemplate: ''
};

function jsonError(message: string, status = 500) {
  return NextResponse.json({ok: false, message}, {status});
}

function logAdminError(scope: string, error: unknown) {
  console.error(`[admin-console:${scope}]`, error);
}

function id(value: unknown) {
  const nextId = Number(value);
  return Number.isInteger(nextId) && nextId > 0 ? nextId : null;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function catalogKey(value: unknown) {
  return text(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function optionalQuantity(value: unknown) {
  if (value === null || value === undefined || text(value).length === 0) {
    return null;
  }

  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
}

function list(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }

  return text(value).split('\n').flatMap((line) => line.split(',')).map((item) => item.trim()).filter(Boolean);
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function removeProductStorageImages(productId: number) {
  if (!supabaseAdmin) return;

  const {data, error} = await supabaseAdmin
    .from('product_images')
    .select('url')
    .eq('product_id', productId);

  if (error) {
    throw new Error(`Could not load product images before delete: ${error.message}`);
  }

  const paths = (data ?? [])
    .map((image) => storagePathFromPublicUrl(String(image.url)))
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  const {error: storageError} = await supabaseAdmin.storage.from(productImagesBucket).remove(paths);

  if (storageError) {
    throw new Error(`Could not remove product image files: ${storageError.message}`);
  }
}

function productRow(input: Record<string, unknown>) {
  const productId = id(input.id);
  const badge = text(input.badge) || 'none';
  const stockStatus = text(input.stock_status) || 'available';
  const row: Record<string, unknown> = {
    name_en: text(input.name_en),
    name_ar: text(input.name_ar),
    description_en: text(input.description_en),
    description_ar: text(input.description_ar),
    price_bhd: Number(input.price_bhd ?? 0),
    old_price_bhd: input.old_price_bhd ? Number(input.old_price_bhd) : null,
    brand_id: id(input.brand_id),
    category_id: id(input.category_id),
    condition: text(input.condition) || 'New',
    warranty: text(input.warranty) || '1 year',
    installments: text(input.installments) || 'Available',
    badge,
    stock_status: stockStatus,
    status: stockStatus === 'deleted' ? 'deleted' : stockStatus,
    is_active: stockStatus !== 'hidden' && stockStatus !== 'deleted',
    storage: list(input.storage),
    colors: list(input.colors),
    specifications_en: list(input.specifications_en),
    specifications_ar: list(input.specifications_ar),
    brand: text(input.brand),
    category: text(input.category),
    specs_en: list(input.specifications_en),
    specs_ar: list(input.specifications_ar),
    accessories: Array.isArray(input.accessories) ? input.accessories : [],
    price: Number(input.price_bhd ?? 0),
    old_price: input.old_price_bhd ? Number(input.old_price_bhd) : null,
    image_url: text(input.image_url) || null,
    image_urls: list(input.image_urls),
    is_featured: badge === 'best-seller',
    is_new: badge === 'new',
    is_offer: badge === 'deal',
    views: Number(input.views ?? 0),
    whatsapp_clicks: Number(input.whatsapp_clicks ?? 0),
    sort_order: Number(input.sort_order ?? 0),
    data: {
      ...(input.data && typeof input.data === 'object' ? input.data : {}),
      quantity: optionalQuantity(input.quantity)
    }
  };

  if (productId) {
    row.id = productId;
  }

  return row;
}

async function requireAdmin() {
  if (!(await hasAdminSession())) {
    return jsonError('Unauthorized.', 401);
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return jsonError('Supabase admin client is not configured.', 503);
  }

  return null;
}

async function loadEmployees() {
  if (!supabaseAdmin) return [];
  const {data, error} = await supabaseAdmin
    .from('employee_roles')
    .select('*')
    .order('created_at', {ascending: false});

  return error ? [] : data ?? [];
}

async function loadProducts() {
  if (!supabaseAdmin) return [];

  const filtered = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', {ascending: false});

  if (filtered.error) {
    throw new Error(filtered.error.message);
  }

  return filtered.data ?? [];
}

async function loadRows(table: string, orderColumn: string, ascending = true) {
  if (!supabaseAdmin) return [];
  const {data, error} = await supabaseAdmin
    .from(table)
    .select('*')
    .order(orderColumn, {ascending});

  return error ? [] : data ?? [];
}

async function loadHomepageRows() {
  if (!supabaseAdmin) return [];
  const result = await supabaseAdmin.from('homepage_sections').select('*').order('sort_order', {ascending: true});
  if (!result.error) return (result.data ?? []).filter((row) => !String(row.source ?? '').startsWith('admin-') && row.publication_state !== 'draft');
  if (!isMissingTableError(result.error)) throw new Error(result.error.message);
  const fallback = await supabaseAdmin.from('store_settings').select('data').eq('id', 'main').maybeSingle();
  if (fallback.error) throw new Error(fallback.error.message);
  const stored = fallback.data?.data && typeof fallback.data.data === 'object' ? (fallback.data.data as Record<string, unknown>).homepage_sections : null;
  return Array.isArray(stored) ? stored : [];
}

function isMissingTableError(error: {message?: string; code?: string} | null) {
  return Boolean(error?.message?.includes('schema cache') || error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.code === '42P01');
}

async function loadCatalogFallback(kind: 'category' | 'brand') {
  if (!supabaseAdmin) return [];
  const homepage = await supabaseAdmin
    .from('homepage_sections')
    .select('*')
    .like('source', `admin-${kind}:%`)
    .order('sort_order', {ascending: true});

  if (!homepage.error) {
    return (homepage.data ?? []).map((row) => {
      const meta = String(row.source ?? '').split(':');
      return {
        id: row.id,
        name_en: row.title_en,
        name_ar: row.title_ar,
        slug: kind === 'category' ? meta[1] ?? row.id : undefined,
        icon: kind === 'category' ? meta.slice(2).join(':') : undefined,
        logo_url: kind === 'brand' ? meta.slice(1).join(':') : undefined,
        sort_order: row.sort_order,
        is_visible: row.is_visible
      };
    });
  }

  const settings = await supabaseAdmin
    .from('store_settings')
    .select('*')
    .like('id', `admin-${kind}-%`);

  return (settings.data ?? []).map((row) => {
    return {
      id: row.id,
      name_en: row.phone_sales ?? '',
      name_ar: row.phone_repairs ?? '',
      slug: kind === 'category' ? row.whatsapp ?? '' : undefined,
      ...(kind === 'brand' ? {slug: row.whatsapp ?? ''} : {}),
      icon: kind === 'category' ? row.logo_url ?? '' : undefined,
      logo_url: kind === 'brand' ? row.logo_url ?? '' : undefined,
      sort_order: Number(row.maps_url ?? 0),
      is_visible: row.instagram !== 'hidden'
    };
  });
}

async function loadCatalogRows(table: 'categories' | 'brands') {
  if (!supabaseAdmin) return [];
  const {data, error} = await supabaseAdmin.from(table).select('*').order('sort_order', {ascending: true});
  if (!error) return data ?? [];
  if (isMissingTableError(error)) return loadCatalogFallback(table === 'categories' ? 'category' : 'brand');
  return [];
}

async function loadSettings() {
  if (!supabaseAdmin) return emptySettings;
  const {data, error} = await supabaseAdmin
    .from('store_settings')
    .select('*')
    .eq('id', 'main')
    .maybeSingle();

  return error ? emptySettings : settingsFromRecord(data, emptySettings);
}

async function saveSettingsFlexible(settings: StoreSettings) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured.');
  }

  const existing = await supabaseAdmin.from('store_settings').select('data').eq('id', 'main').maybeSingle();
  const existingData = existing.data?.data && typeof existing.data.data === 'object' ? existing.data.data : {};
  const row = {
    ...settingsToRecord(settings),
    data: {
      ...existingData,
      benefitpay_enabled: settings.benefitPayEnabled,
      benefitpay_qr_url: settings.benefitPayQr,
      benefitpay_instructions_ar: settings.benefitPayInstructionsAr,
      benefitpay_instructions_en: settings.benefitPayInstructionsEn
    }
  };
  const removedColumns = new Set<string>();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = Object.fromEntries(Object.entries(row).filter(([key]) => !removedColumns.has(key)));
    const {error} = await supabaseAdmin.from('store_settings').upsert(candidate, {onConflict: 'id'});

    if (!error) {
      return;
    }

    const missingColumn = error.message.match(/Could not find the '([^']+)' column/)?.[1];
    if (!missingColumn) {
      throw new Error(error.message);
    }

    removedColumns.add(missingColumn);
  }

  throw new Error('Could not save settings because too many store_settings columns are missing.');
}

async function loadLeads() {
  if (!supabaseAdmin) return [];
  const withProducts = await supabaseAdmin
    .from('leads')
    .select('*, products(id, name_en, name_ar)')
    .order('created_at', {ascending: false})
    .limit(200);

  if (!withProducts.error) {
    return withProducts.data ?? [];
  }

  const plain = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(200);

  return plain.error ? [] : plain.data ?? [];
}

async function snapshot() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured.');
  }

  const [
    products,
    categories,
    brands,
    homepage,
    settings,
    leads,
    employees
  ] = await Promise.all([
    loadProducts(),
    loadCatalogRows('categories'),
    loadCatalogRows('brands'),
    loadHomepageRows(),
    loadSettings(),
    loadLeads(),
    loadEmployees()
  ]);

  return {
    products,
    categories,
    brands,
    homepage,
    settings,
    leads,
    employees
  };
}

function revalidateAdminAndPublic(productId?: number) {
  revalidatePath('/ar');
  revalidatePath('/en');
  revalidatePath('/ar/admin');
  revalidatePath('/en/admin');

  if (productId) {
    revalidatePath(`/ar/product/${productId}`);
    revalidatePath(`/en/product/${productId}`);
  }
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    return NextResponse.json({ok: true, data: await snapshot()});
  } catch (error) {
    logAdminError('GET', error);
    return jsonError(error instanceof Error ? error.message : 'Could not load admin data.');
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    payload?: Record<string, unknown>;
  } | null;

  if (!body?.action || !supabaseAdmin) {
    return jsonError('Invalid admin action.', 400);
  }

  try {
    const payload = body.payload ?? {};

    if (body.action === 'saveProduct') {
      const row = productRow(payload);
      const query = row.id
        ? supabaseAdmin.from('products').upsert(row, {onConflict: 'id'}).select('id').single()
        : supabaseAdmin.from('products').insert(row).select('id').single();
      const {data, error} = await query;
      if (error || !data) throw new Error(error?.message || 'Product save failed.');
      revalidateAdminAndPublic(Number(data.id));
    }

    if (body.action === 'archiveProduct') {
      const productId = id(payload.id);
      if (!productId) throw new Error('Missing product id.');
      const {error} = await supabaseAdmin
        .from('products')
        .update({is_active: false, status: 'deleted', stock_status: 'deleted'})
        .eq('id', productId);
      if (error) throw new Error(error.message);
      revalidateAdminAndPublic(productId);
    }

    if (body.action === 'deleteProduct') {
      const productId = id(payload.id);
      if (!productId) throw new Error('Missing product id.');
      await removeProductStorageImages(productId);
      const imageDelete = await supabaseAdmin.from('product_images').delete().eq('product_id', productId);
      if (imageDelete.error) throw new Error(imageDelete.error.message);
      const productDelete = await supabaseAdmin.from('products').delete().eq('id', productId).select('id');
      if (productDelete.error) throw new Error(productDelete.error.message);
      if (!productDelete.data?.length) throw new Error('Product row was not found.');
      revalidateAdminAndPublic(productId);
    }

    if (body.action === 'saveCategory') {
      const row = {
        id: id(payload.id) ?? undefined,
        name_en: text(payload.name_en),
        name_ar: text(payload.name_ar),
        slug: text(payload.slug),
        icon: text(payload.icon),
        sort_order: Number(payload.sort_order ?? 0)
      };
      const {error} = await supabaseAdmin.from('categories').upsert(row, {onConflict: 'id'});
      if (error && !isMissingTableError(error)) throw new Error(error.message);
      if (error && isMissingTableError(error)) {
        const slug = text(payload.slug) || text(payload.name_en).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const fallback = {
          id: text(payload.id) || `category-${slug}`,
          title_en: text(payload.name_en),
          title_ar: text(payload.name_ar),
          source: `admin-category:${slug}:${text(payload.icon)}`,
          is_visible: payload.is_visible !== false,
          sort_order: Number(payload.sort_order ?? 0)
        };
        const saved = await supabaseAdmin.from('homepage_sections').upsert(fallback, {onConflict: 'id'});
        if (saved.error && !isMissingTableError(saved.error)) throw new Error(saved.error.message);
        if (saved.error && isMissingTableError(saved.error)) {
          const fallbackId = `admin-category-${slug}`;
          const fallbackSettings = {
            id: fallbackId,
            logo_url: text(payload.icon),
            banner_url: 'category',
            whatsapp: slug,
            phone_sales: text(payload.name_en),
            phone_repairs: text(payload.name_ar),
            maps_url: String(Number(payload.sort_order ?? 0)),
            instagram: payload.is_visible === false ? 'hidden' : 'visible'
          };
          const savedSettings = await supabaseAdmin.from('store_settings').upsert(fallbackSettings, {onConflict: 'id'});
          if (savedSettings.error) throw new Error(savedSettings.error.message);
        }
      }
      revalidateAdminAndPublic();
    }

    if (body.action === 'deleteCategory') {
      const categoryId = payload.id;
      if (!categoryId) throw new Error('Missing category id.');
      const {error} = await supabaseAdmin.from('categories').delete().eq('id', categoryId);
      if (error && !isMissingTableError(error)) throw new Error(error.message);
      if (error && isMissingTableError(error)) {
        const deleted = await supabaseAdmin.from('homepage_sections').delete().eq('id', categoryId);
        if (deleted.error && !isMissingTableError(deleted.error)) throw new Error(deleted.error.message);
        if (deleted.error && isMissingTableError(deleted.error)) {
          const deletedSettings = await supabaseAdmin
            .from('store_settings')
            .delete()
            .in('id', [String(categoryId), `admin-category-${String(categoryId).replace(/^admin-category-/, '')}`]);
          if (deletedSettings.error) throw new Error(deletedSettings.error.message);
        }
      }
      revalidateAdminAndPublic();
    }

    if (body.action === 'saveBrand') {
      let brandId = id(payload.id) ?? undefined;
      if (!brandId) {
        const existing = await supabaseAdmin.from('brands').select('id,name_en');
        if (!existing.error) {
          brandId = existing.data?.find((brand) => catalogKey(brand.name_en) === catalogKey(payload.name_en))?.id;
        } else if (!isMissingTableError(existing.error)) {
          throw new Error(existing.error.message);
        }
      }
      const row = {
        id: brandId,
        name_en: text(payload.name_en),
        name_ar: text(payload.name_ar),
        logo_url: text(payload.logo_url) || null,
        sort_order: Number(payload.sort_order ?? 0),
        homepage_url: text(payload.homepage_url) || null,
        is_visible: payload.is_visible !== false
      };
      const {error} = await supabaseAdmin.from('brands').upsert(row, {onConflict: 'id'});
      if (error && !isMissingTableError(error)) throw new Error(error.message);
      if (error && isMissingTableError(error)) {
        const key = text(payload.slug) || text(payload.id) || text(payload.name_en).toLowerCase().replace(/[^a-z0-9]+/g, '-') || `brand-${Date.now()}`;
        const fallback = {
          id: `admin-brand-${key}`,
          title_en: text(payload.name_en),
          title_ar: text(payload.name_ar),
          source: `admin-brand:${text(payload.logo_url)}`,
          is_visible: payload.is_visible !== false,
          sort_order: Number(payload.sort_order ?? 0)
        };
        const saved = await supabaseAdmin.from('homepage_sections').upsert(fallback, {onConflict: 'id'});
        if (saved.error && !isMissingTableError(saved.error)) throw new Error(saved.error.message);
        if (saved.error && isMissingTableError(saved.error)) {
          const fallbackSettings = {
            id: `admin-brand-${key}`,
            logo_url: text(payload.logo_url),
            banner_url: 'brand',
            whatsapp: key,
            phone_sales: text(payload.name_en),
            phone_repairs: text(payload.name_ar),
            maps_url: String(Number(payload.sort_order ?? 0)),
            instagram: payload.is_visible === false ? 'hidden' : 'visible'
          };
          const savedSettings = await supabaseAdmin.from('store_settings').upsert(fallbackSettings, {onConflict: 'id'});
          if (savedSettings.error) throw new Error(savedSettings.error.message);
        }
      }
      revalidateAdminAndPublic();
    }

    if (body.action === 'deleteBrand') {
      const brandId = payload.id;
      if (!brandId) throw new Error('Missing brand id.');
      const {error} = await supabaseAdmin.from('brands').update({is_visible: false}).eq('id', brandId);
      if (error && !isMissingTableError(error)) throw new Error(error.message);
      if (error && isMissingTableError(error)) {
        const deleted = await supabaseAdmin.from('homepage_sections').delete().eq('id', brandId);
        if (deleted.error && !isMissingTableError(deleted.error)) throw new Error(deleted.error.message);
        if (deleted.error && isMissingTableError(deleted.error)) {
          const deletedSettings = await supabaseAdmin
            .from('store_settings')
            .delete()
            .in('id', [String(brandId), `admin-brand-${String(brandId).replace(/^admin-brand-/, '')}`]);
          if (deletedSettings.error) throw new Error(deletedSettings.error.message);
        }
      }
      revalidateAdminAndPublic();
    }

    if (body.action === 'publishHomepage') {
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      const published = rows.map((candidate) => {
        const item = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {};
        const source = text(item.source);
        if (source.startsWith('homepage-config:')) {
          try {
            const config = JSON.parse(decodeURIComponent(source.slice('homepage-config:'.length))) as Record<string, unknown>;
            if (['hero', 'small_banner', 'image_slider', 'image_text', 'custom'].includes(text(config.type)) && item.is_visible !== false && !text(config.desktop_image) && !text(config.mobile_image)) {
              throw new Error('Desktop media is required / وسائط الكمبيوتر مطلوبة.');
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes('وسائط الكمبيوتر')) throw error;
            throw new Error('Invalid homepage section configuration / إعداد القسم غير صالح.');
          }
        }
        let config: Record<string, unknown> = {};
        if (source.startsWith('homepage-config:')) {
          try { config = JSON.parse(decodeURIComponent(source.slice('homepage-config:'.length))) as Record<string, unknown>; } catch {}
        }
        return {
          id: text(item.id),
          section_type: text(config.type) || 'custom',
          title_en: text(item.title_en) || 'Homepage Banner',
          title_ar: text(item.title_ar) || 'بنر الصفحة الرئيسية',
          content: config,
          source,
          is_visible: item.is_visible !== false,
          sort_order: Number(item.sort_order ?? 0),
          publication_state: 'published',
          updated_at: new Date().toISOString()
        };
      }).filter((row) => row.id && row.source);
      if (!published.length) throw new Error('At least one valid homepage section is required.');
      const saved = await supabaseAdmin.from('homepage_sections').upsert(published, {onConflict: 'id'});
      const deletedIds = Array.isArray(payload.deletedIds) ? payload.deletedIds.map(text).filter((sectionId) => sectionId && !sectionId.startsWith('admin-')) : [];
      if (saved.error && isMissingTableError(saved.error)) {
        const fallbackRows = published.map(({section_type: _sectionType, content: _content, updated_at: _updatedAt, ...row}) => row);
        const existing = await supabaseAdmin.from('store_settings').select('data').eq('id', 'main').maybeSingle();
        const existingData = existing.data?.data && typeof existing.data.data === 'object' ? existing.data.data : {};
        const fallback = await supabaseAdmin.from('store_settings').upsert({id: 'main', data: {...existingData, homepage_sections: fallbackRows}}, {onConflict: 'id'});
        if (fallback.error) throw new Error(`Homepage fallback save failed: ${fallback.error.message}`);
      } else if (saved.error) throw new Error(saved.error.message);
      else if (deletedIds.length) {
        const deleted = await supabaseAdmin.from('homepage_sections').delete().in('id', deletedIds);
        if (deleted.error) throw new Error(deleted.error.message);
      }
      revalidateAdminAndPublic();
    }

    if (body.action === 'saveHomepage') {
      const row = {
        id: text(payload.id),
        title_en: text(payload.title_en),
        title_ar: text(payload.title_ar),
        source: text(payload.source),
        is_visible: Boolean(payload.is_visible),
        sort_order: Number(payload.sort_order ?? 0)
      };
      const {error} = await supabaseAdmin.from('homepage_sections').upsert(row, {onConflict: 'id'});
      if (error) throw new Error(error.message);
      revalidateAdminAndPublic();
    }

    if (body.action === 'deleteHomepage') {
      const sectionId = text(payload.id);
      if (!sectionId) throw new Error('Missing section id.');
      const {error} = await supabaseAdmin.from('homepage_sections').delete().eq('id', sectionId);
      if (error) throw new Error(error.message);
      revalidateAdminAndPublic();
    }

    if (body.action === 'saveSettings') {
      await saveSettingsFlexible(payload as StoreSettings);
      revalidateAdminAndPublic();
    }

    if (body.action === 'deleteLead') {
      const leadId = id(payload.id);
      if (!leadId) throw new Error('Missing lead id.');
      const {error} = await supabaseAdmin.from('leads').delete().eq('id', leadId);
      if (error) throw new Error(error.message);
    }

    if (body.action === 'saveEmployee') {
      const row = {
        id: id(payload.id) ?? undefined,
        name: text(payload.name),
        email: text(payload.email),
        role: text(payload.role) || 'staff',
        is_active: payload.is_active !== false
      };
      const {error} = await supabaseAdmin.from('employee_roles').upsert(row, {onConflict: 'id'});
      if (error) throw new Error(`${error.message}. Create the employee_roles table from supabase/schema.sql.`);
    }

    if (body.action === 'deleteEmployee') {
      const employeeId = id(payload.id);
      if (!employeeId) throw new Error('Missing employee id.');
      const {error} = await supabaseAdmin.from('employee_roles').delete().eq('id', employeeId);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ok: true, data: await snapshot()});
  } catch (error) {
    logAdminError(String(body.action), error);
    return jsonError(error instanceof Error ? error.message : 'Admin action failed.');
  }
}
