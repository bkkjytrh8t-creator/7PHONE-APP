import {AdminDashboard} from '@/components/AdminDashboard';
import {AdminShell} from '@/components/AdminShell';
import {getProducts, getSettings} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function AdminPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <AdminShell locale={locale}>
      <AdminDashboard locale={locale} products={products} settings={settings} />
    </AdminShell>
  );
}
