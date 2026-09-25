import {AdminLoginPanel} from '@/components/AdminLoginPanel';
import {hasAdminSession} from '@/lib/adminAuth';
import type {Locale} from '@/lib/types';
import {redirect} from 'next/navigation';

export default async function AdminLoginPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;

  if (await hasAdminSession()) {
    redirect(`/${locale}/admin`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050506] px-4 py-10 text-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 p-6">
        <p className="text-xs font-black uppercase text-brand-neon">7phone Admin</p>
        <h1 className="mt-2 text-3xl font-black">{locale === 'ar' ? 'دخول الإدارة' : 'Admin login'}</h1>
        <AdminLoginPanel locale={locale} />
      </section>
    </main>
  );
}
