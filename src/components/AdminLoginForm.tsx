'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {isSupabaseConfigured, supabase} from '@/lib/supabase';
import type {Locale} from '@/lib/types';

export function AdminLoginForm({locale}: {locale: Locale}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    const {error} = await supabase.auth.signInWithPassword({email, password});

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/${locale}/admin`);
    router.refresh();
  }

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-2xl bg-zinc-50 p-4 font-semibold text-zinc-600">
        Add Supabase environment variables before admin login can be used.
      </p>
    );
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 font-bold">
        Email
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand-neon"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className="grid gap-2 font-bold">
        Password
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand-neon"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <button className="rounded-full bg-brand-neon px-5 py-3 font-black text-white" type="submit">
        Login
      </button>
      {message ? <p className="font-semibold text-brand-pink">{message}</p> : null}
    </form>
  );
}
