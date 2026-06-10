import {AdminLoginForm} from '@/components/AdminLoginForm';
import type {Locale} from '@/lib/types';

export default async function AdminLoginPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-[20px] bg-white p-6 shadow-neon">
        <h1 className="text-3xl font-black text-brand-ink">Admin login</h1>
        <AdminLoginForm locale={locale} />
      </div>
    </main>
  );
}
