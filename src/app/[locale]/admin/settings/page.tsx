import {AdminShell} from '@/components/AdminShell';
import {AdminSettingsManager} from '@/components/AdminSettingsManager';
import {getSettings} from '@/lib/data';
import type {Locale} from '@/lib/types';

export default async function AdminSettingsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const settings = await getSettings();

  return (
    <AdminShell locale={locale}>
      <AdminSettingsManager locale={locale} settings={settings} />
    </AdminShell>
  );
}
