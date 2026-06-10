'use client';

import {useEffect, useState} from 'react';

type InstallPrompt = Event & {prompt: () => Promise<void>; userChoice: Promise<{outcome: string}>};

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => undefined);
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-brand-neon/50 bg-black p-3 shadow-neon-strong">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">أضف 7Phone إلى الشاشة الرئيسية</p>
        <button className="rounded-xl bg-brand-neon px-4 py-2 text-xs font-black text-white" onClick={install} type="button">
          إضافة
        </button>
      </div>
    </div>
  );
}
