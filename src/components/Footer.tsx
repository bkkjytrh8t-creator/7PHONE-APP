import type {StoreSettings} from '@/lib/types';

export function Footer({settings}: {settings: StoreSettings}) {
  return (
    <footer className="border-t border-[#ececec] bg-[#f0f1f3] px-4 py-14 text-[#111111]">
      <div className="mx-auto grid max-w-7xl gap-8 text-sm md:grid-cols-4 md:items-center">
        <div>
          <div className="text-xl font-black">7Phone ©</div>
          <p className="mt-2 text-[#666666]">7phone.app</p>
        </div>
        <a href={`tel:${settings.phoneSales}`} className="font-bold hover:text-brand-neon">
          {settings.phoneSales}
        </a>
        <a href={`tel:${settings.whatsapp.replace('973', '')}`} className="font-bold hover:text-brand-neon">
          39011777
        </a>
        <a href={settings.instagram} className="font-bold hover:text-brand-neon" target="_blank" rel="noreferrer">
          @7phone
        </a>
      </div>
    </footer>
  );
}
