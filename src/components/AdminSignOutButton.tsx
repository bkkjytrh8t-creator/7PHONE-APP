'use client';

import {useRouter} from 'next/navigation';
import type {Locale} from '@/lib/types';

export function AdminSignOutButton({locale}: {locale: Locale}) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', {method: 'POST'});
    router.push(`/${locale}/admin/login`);
    router.refresh();
  }

  return (
    <button
      className="rounded-md bg-brand-neon px-3 py-2 text-sm font-black text-white"
      onClick={logout}
      type="button"
    >
      {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
    </button>
  );
}
