'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {Locale} from '@/lib/types';

type NavItem = {
  labelEn: string;
  labelAr: string;
  href: string;
  icon?: string;
};

const navItems: NavItem[] = [
  {labelEn: 'Dashboard', labelAr: 'لوحة التحكم', href: '/admin/products'},
  {labelEn: 'Products', labelAr: 'المنتجات', href: '/admin/products'},
  {labelEn: 'Orders', labelAr: 'الطلبات', href: '/admin/leads'},
  {labelEn: 'Categories', labelAr: 'الأقسام', href: '/admin/categories'},
  {labelEn: 'Brands', labelAr: 'الماركات', href: '/admin/brands'},
  {labelEn: 'Homepage', labelAr: 'الصفحة الرئيسية', href: '/admin/homepage'},
  {labelEn: 'Store Settings', labelAr: 'إعدادات المتجر', href: '/admin/settings'},
  {labelEn: 'Media Library', labelAr: 'مكتبة الوسائط', href: '/admin/media'},
  {labelEn: 'Users & Roles', labelAr: 'المستخدمون والصلاحيات', href: '/admin/users'},
  {labelEn: 'Activity Log', labelAr: 'سجل النشاط', href: '/admin/activity'}
];

function buttonClass(active: boolean) {
  return active
    ? 'flex min-h-10 items-center rounded-md bg-brand-neon px-3 py-2 text-sm font-black text-white'
    : 'flex min-h-10 items-center rounded-md border border-white/10 bg-black px-3 py-2 text-sm font-black text-zinc-300 transition hover:border-brand-neon/60 hover:text-white';
}

export function AdminShell({
  locale,
  title,
  subtitle,
  children,
  actions
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isArabic = locale === 'ar';
  const otherLocale = isArabic ? 'en' : 'ar';
  const otherPath = pathname.replace(/^\/(ar|en)(?=\/)/, `/${otherLocale}`);

  return (
    <main className="min-h-screen bg-[#050506] text-white" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-zinc-950 p-4 lg:border-b-0 lg:border-e lg:border-white/10">
          <div className="flex items-center justify-between gap-3 lg:grid">
            <div>
              <p className="text-xs font-black uppercase text-brand-neon">7Phone Admin</p>
              <h1 className="mt-1 text-xl font-black">{isArabic ? 'إدارة المتجر' : 'Store Admin'}</h1>
            </div>
            <Link className="rounded-md border border-white/10 bg-black px-3 py-2 text-sm font-black text-zinc-200" href={otherPath}>
              {isArabic ? 'English' : 'العربية'}
            </Link>
          </div>
          <nav className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const href = `/${locale}${item.href}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link className={buttonClass(active)} href={href} key={item.href}>
                  {item.icon ? <span aria-hidden="true" className="me-2 shrink-0 text-base">{item.icon}</span> : null}
                  <span>{isArabic ? item.labelAr : item.labelEn}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-white/10 bg-black px-4 py-4">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black md:text-3xl">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm font-bold text-zinc-400">{subtitle}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">{actions}</div>
            </div>
          </header>
          <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
