import 'server-only';

import {createClient} from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const productImagesBucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || 'product-images';
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
