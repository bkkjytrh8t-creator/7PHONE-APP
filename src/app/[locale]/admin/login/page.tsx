import {AdminLoginForm} from '@/components/AdminLoginForm';
import {hasAdminSession} from '@/lib/adminAuth';
import type {Locale} from '@/lib/types';
import {redirect} from 'next/navigation';

export default async function AdminLoginPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const isAllowed = await hasAdminSession();

  if (isAllowed) {
    redirect(`/${locale}/admin`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050506] px-4 py-10 text-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-neon">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-neon">7phone.app</p>
        <h1 className="mt-2 text-3xl font-black text-white">
          {locale === 'ar' ? 'دخول الإدارة' : 'Admin login'}
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-400">
          {locale === 'ar'
            ? 'منطقة منفصلة وآمنة لإدارة المتجر.'
            : 'Separate secure access for store management.'}
        </p>
        <AdminLoginForm locale={locale} />
      </div>
    </main>
  );
}
