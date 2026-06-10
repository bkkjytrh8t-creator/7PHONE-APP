'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {supabase, isSupabaseConfigured} from '@/lib/supabase';
import type {Locale} from '@/lib/types';

export function AdminAuthGate({
  locale,
  children
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked' | 'unconfigured'>(
    isSupabaseConfigured ? 'checking' : 'unconfigured'
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({data}) => {
      setStatus(data.session ? 'allowed' : 'blocked');
    });
  }, []);

  if (status === 'allowed' || status === 'unconfigured') {
    return (
      <>
        {status === 'unconfigured' ? (
          <div className="bg-brand-pink px-4 py-2 text-center text-sm font-bold text-white">
            Admin preview mode: Supabase is not connected yet, so changes and image uploads are not saved.
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-[20px] bg-white p-6 shadow-neon">
        <h1 className="text-3xl font-black text-brand-ink">Admin access</h1>
        {status === 'checking' ? (
          <p className="mt-3 text-zinc-600">Checking your Supabase session...</p>
        ) : null}
        {status === 'blocked' ? (
          <>
            <p className="mt-3 text-zinc-600">Sign in with an authorized Supabase admin account.</p>
            <Link
              className="mt-5 inline-flex rounded-full bg-brand-neon px-5 py-3 font-black text-white"
              href={`/${locale}/admin/login`}
            >
              Login
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
