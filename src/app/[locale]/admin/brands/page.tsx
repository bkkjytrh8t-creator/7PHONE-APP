import {AdminAuthGate} from '@/components/AdminAuthGate';
import {brands} from '@/lib/seed';
import type {Locale} from '@/lib/types';

export default async function AdminBrandsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;

  return (
    <AdminAuthGate locale={locale}>
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-[20px] bg-white p-6 shadow-neon">
        <h1 className="text-3xl font-black">Brands</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {brands.map((brand) => (
            <div className="rounded-2xl border border-zinc-200 p-4 text-center font-black" key={brand.id}>
              {brand.name_en}
            </div>
          ))}
        </div>
      </div>
      </main>
    </AdminAuthGate>
  );
}
