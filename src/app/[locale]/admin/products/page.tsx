import {AdminShell} from '@/components/AdminShell';
import {AdminProductManager} from '@/components/AdminProductManager';
import {getProducts} from '@/lib/data';
import {brands, categories} from '@/lib/seed';
import type {Locale} from '@/lib/types';

export default async function AdminProductsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const products = await getProducts();

  return (
    <AdminShell locale={locale}>
      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-2xl font-black text-white">{locale === 'ar' ? 'المنتجات' : 'Products'}</h2>
        <p className="mt-2 text-sm font-semibold text-zinc-400">
          {locale === 'ar'
            ? 'إضافة وتعديل وحفظ المنتجات دائماً عند توفر Supabase، مع fallback مؤقت عند عدم تهيئة التخزين.'
            : 'Add, edit, and save products permanently when Supabase is configured, with temporary fallback when storage is not configured.'}
        </p>
        <AdminProductManager
          locale={locale}
          seedProducts={products}
          categories={categories}
          brands={brands}
        />
      </section>
    </AdminShell>
  );
}
