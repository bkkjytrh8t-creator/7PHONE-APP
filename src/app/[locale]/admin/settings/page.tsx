import {AdminAuthGate} from '@/components/AdminAuthGate';
import {AdminSettingsManager} from '@/components/AdminSettingsManager';
import {getSettings} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function AdminSettingsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const settings = await getSettings();

  return (
    <AdminAuthGate locale={locale}>
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
        <AdminSettingsManager locale={locale} settings={settings} />
      </main>
    </AdminAuthGate>
  );
}
