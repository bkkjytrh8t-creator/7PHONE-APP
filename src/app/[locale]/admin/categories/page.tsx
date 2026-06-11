import {AdminShell} from '@/components/AdminShell';
import {getCategories} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function AdminCategoriesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const categories = await getCategories();

  return (
    <AdminShell locale={locale}>
      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-2xl font-black text-white">{locale === 'ar' ? 'التصنيفات' : 'Categories'}</h2>
        <div className="mt-6 grid gap-3">
          {categories.map((category) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 font-bold text-zinc-200" key={category.id}>
              {category.icon} {category.name_en} / {category.name_ar}
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
