import {AdminShell} from '@/components/AdminShell';
import {brands} from '@/lib/seed';
import type {Locale} from '@/lib/types';

export default async function AdminBrandsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;

  return (
    <AdminShell locale={locale}>
      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-2xl font-black text-white">{locale === 'ar' ? 'العلامات التجارية' : 'Brands'}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {brands.map((brand) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center font-black text-zinc-200" key={brand.id}>
              {brand.name_en}
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
