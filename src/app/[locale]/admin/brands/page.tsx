import {AdminV2} from '@/components/admin-v2/AdminV2';
import {hasAdminSession} from '@/lib/adminAuth';
import type {Locale} from '@/lib/types';
import {redirect} from 'next/navigation';

export default async function AdminBrandsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;

  if (!(await hasAdminSession())) {
    redirect(`/${locale}/admin/login`);
  }

  return <AdminV2 locale={locale} view="brands" />;
}
