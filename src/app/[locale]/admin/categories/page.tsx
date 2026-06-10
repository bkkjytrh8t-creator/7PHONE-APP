import {AdminAuthGate} from '@/components/AdminAuthGate';
import {getCategories} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function AdminCategoriesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const categories = await getCategories();

  return (
    <AdminAuthGate locale={locale}>
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-[20px] bg-white p-6 shadow-neon">
        <h1 className="text-3xl font-black">Categories</h1>
        <div className="mt-6 grid gap-3">
          {categories.map((category) => (
            <div className="rounded-2xl border border-zinc-200 p-4 font-bold" key={category.id}>
              {category.icon} {category.name_en} / {category.name_ar}
            </div>
          ))}
        </div>
      </div>
      </main>
    </AdminAuthGate>
  );
}
