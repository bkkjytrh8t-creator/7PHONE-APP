'use client';

import {useEffect, useState} from 'react';
import type {Locale} from '@/lib/types';

type Member = {
  name: string;
  phone: string;
  points: number;
};

export function MembershipRewards({locale}: {locale: Locale}) {
  const storageKey = '7phone-member';
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        setMember(JSON.parse(saved) as Member);
      }
    } catch {
      setMember(null);
    }
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextMember = {
      name: name.trim(),
      phone: phone.trim(),
      points: 50
    };

    setMember(nextMember);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextMember));
    } catch {
      // Membership preview still appears even if localStorage is blocked.
    }
  }

  const copy =
    locale === 'ar'
      ? {
          badge: 'Rewards',
          title: 'عضوية 7Phone',
          subtitle: 'سجّل اختيارياً واحصل على نقاط وهدايا.',
          name: 'الاسم',
          phone: 'رقم الهاتف',
          join: 'انضم',
          joined: 'مفعلة',
          points: 'نقطة',
          perks: ['نقاط', 'هدايا', 'عروض خاصة']
        }
      : {
          badge: 'Rewards',
          title: '7Phone membership',
          subtitle: 'Join optionally for points, gifts, and special deals.',
          name: 'Name',
          phone: 'Phone number',
          join: 'Join',
          joined: 'Active',
          points: 'pts',
          perks: ['Points', 'Gifts', 'Special deals']
        };

  return (
    <section className="border-y border-zinc-200 bg-white px-4 py-3">
      <div className="mx-auto grid max-w-7xl gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-neon text-[10px] font-black text-white">
            {copy.badge}
          </div>
          <div className="min-w-44">
            <h2 className="text-sm font-black leading-5 text-brand-ink">{copy.title}</h2>
            <p className="text-xs font-semibold leading-5 text-zinc-500">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {copy.perks.map((perk) => (
              <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-brand-pink" key={perk}>
                {perk}
              </span>
            ))}
          </div>
        </div>

        {member ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-black px-3 py-2 text-white md:justify-start">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-brand-neon">{copy.joined}</div>
              <div className="max-w-32 truncate text-sm font-black">{member.name}</div>
            </div>
            <div className="rounded-md bg-white px-3 py-1 text-sm font-black text-brand-pink">
              {member.points} {copy.points}
            </div>
          </div>
        ) : (
          <form className="grid gap-2 rounded-xl bg-white p-1 md:grid-cols-[120px_150px_auto]" onSubmit={submit}>
            <input
              className="h-9 min-w-0 rounded-lg border border-zinc-200 px-3 text-xs font-semibold outline-none focus:border-brand-neon"
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.name}
              required
              type="text"
              value={name}
            />
            <input
              className="h-9 min-w-0 rounded-lg border border-zinc-200 px-3 text-xs font-semibold outline-none focus:border-brand-neon"
              onChange={(event) => setPhone(event.target.value)}
              placeholder={copy.phone}
              required
              type="tel"
              value={phone}
            />
            <button className="h-9 rounded-lg bg-brand-neon px-4 text-xs font-black text-white" type="submit">
              {copy.join}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
