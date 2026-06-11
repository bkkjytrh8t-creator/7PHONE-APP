import Link from 'next/link';
import {redirect} from 'next/navigation';
import {hasAdminSession} from '@/lib/adminAuth';
import type {Locale} from '@/lib/types';
import {AdminSignOutButton} from './AdminSignOutButton';

const labels = {
  en: {
    title: '7Phone Admin',
    subtitle: 'Controlled store management',
    temporary: 'Temporary secure mode: data edits are saved in this browser until Supabase or another database is connected.',
    dashboard: 'Dashboard',
    products: 'Products',
    categories: 'Categories',
    settings: 'Settings'
  },
  ar: {
    title: 'لوحة 7Phone',
    subtitle: 'إدارة المتجر بشكل محكم',
    temporary: 'وضع حماية مؤقت: تعديلات البيانات تحفظ في هذا المتصفح إلى أن يتم ربط Supabase أو قاعدة بيانات.',
    dashboard: 'الرئيسية',
    products: 'المنتجات',
    categories: 'التصنيفات',
    settings: 'الإعدادات'
  }
};

export async function AdminShell({
  locale,
  children
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const isAllowed = await hasAdminSession();

  if (!isAllowed) {
    redirect(`/${locale}/admin/login`);
  }

  const copy = labels[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <main className="min-h-screen bg-[#050506] text-white" dir={dir}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
        <header className="rounded-lg border border-white/10 bg-zinc-950/90 p-4 shadow-neon">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-neon">7phone.app</p>
              <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{copy.title}</h1>
              <p className="mt-1 text-sm font-semibold text-zinc-400">{copy.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-black text-zinc-200 hover:border-brand-neon"
                href={`/${otherLocale}/admin`}
              >
                {otherLocale.toUpperCase()}
              </Link>
              <Link
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-black text-zinc-200 hover:border-brand-neon"
                href="/"
              >
                7phone.app
              </Link>
              <AdminSignOutButton locale={locale} />
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto">
            {[
              [copy.dashboard, `/${locale}/admin`],
              [copy.products, `/${locale}/admin/products`],
              [copy.categories, `/${locale}/admin/categories`],
              [copy.settings, `/${locale}/admin/settings`]
            ].map(([label, href]) => (
              <Link
                className="shrink-0 rounded-md bg-white/5 px-3 py-2 text-sm font-black text-zinc-200 hover:bg-brand-neon hover:text-white"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="rounded-lg border border-brand-neon/35 bg-brand-neon/10 px-4 py-3 text-sm font-bold text-pink-100">
          {copy.temporary}
        </div>
        {children}
      </div>
    </main>
  );
}
