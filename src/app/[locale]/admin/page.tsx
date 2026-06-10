import Link from 'next/link';
import {getTranslations} from 'next-intl/server';
import {AdminAuthGate} from '@/components/AdminAuthGate';
import type {Locale} from '@/lib/types';

export default async function AdminPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const t = await getTranslations();
  const sections = ['products', 'categories', 'brands', 'settings'];

  return (
    <AdminAuthGate locale={locale}>
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[20px] bg-white p-6 shadow-neon">
        <h1 className="text-3xl font-black text-brand-ink">{t('admin')}</h1>
        <p className="mt-2 text-zinc-600">{t('adminNote')}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {sections.map((section) => (
            <Link
              className="rounded-2xl border border-brand-neon/40 p-5 text-center font-black capitalize text-brand-pink hover:shadow-neon"
              href={`/${locale}/admin/${section}`}
              key={section}
            >
              {section}
            </Link>
          ))}
        </div>
      </div>
      </main>
    </AdminAuthGate>
  );
}
