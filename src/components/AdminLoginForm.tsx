'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Locale} from '@/lib/types';

export function AdminLoginForm({locale}: {locale: Locale}) {
  const router = useRouter();
  const [email, setEmail] = useState('admin@7phone.app');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password})
    });

    if (!response.ok) {
      setMessage(locale === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid admin login.');
      setIsSubmitting(false);
      return;
    }

    router.push(`/${locale}/admin`);
    router.refresh();
  }

  return (
    <form className="mt-6 grid gap-4" dir={locale === 'ar' ? 'rtl' : 'ltr'} onSubmit={submit}>
      <label className="grid gap-2 text-sm font-bold text-zinc-200">
        {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
        <input
          autoComplete="username"
          className="h-12 rounded-md border border-white/10 bg-zinc-950 px-4 text-white outline-none focus:border-brand-neon"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-zinc-200">
        {locale === 'ar' ? 'كلمة المرور' : 'Password'}
        <input
          autoComplete="current-password"
          className="h-12 rounded-md border border-white/10 bg-zinc-950 px-4 text-white outline-none focus:border-brand-neon"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <button
        className="h-12 rounded-md bg-brand-neon px-5 text-sm font-black text-white disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (locale === 'ar' ? 'جاري الدخول...' : 'Signing in...') : locale === 'ar' ? 'دخول' : 'Login'}
      </button>
      {message ? <p className="font-semibold text-brand-pink">{message}</p> : null}
    </form>
  );
}
