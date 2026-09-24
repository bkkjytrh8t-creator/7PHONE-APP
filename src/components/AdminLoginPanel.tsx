'use client';

import {useState} from 'react';
import type {Locale} from '@/lib/types';

export function AdminLoginPanel({locale}: {locale: Locale}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({identifier, password})
    });

    if (!response.ok) {
      setMessage(locale === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid admin credentials.');
      setIsSubmitting(false);
      return;
    }

    window.location.assign(`/${locale}/admin`);
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submit}>
      <input
        className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm font-semibold text-white outline-none focus:border-brand-neon"
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder={locale === 'ar' ? 'رقم الهاتف أو البريد' : 'Phone or email'}
        type="text"
        value={identifier}
      />
      <input
        className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm font-semibold text-white outline-none focus:border-brand-neon"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={locale === 'ar' ? 'كلمة المرور' : 'Password'}
        type="password"
        value={password}
      />
      {message ? <p className="text-sm font-bold text-red-200">{message}</p> : null}
      <button className="h-11 rounded-md bg-brand-neon text-sm font-black text-white" disabled={isSubmitting} type="submit">
        {isSubmitting ? '...' : locale === 'ar' ? 'دخول' : 'Login'}
      </button>
    </form>
  );
}
