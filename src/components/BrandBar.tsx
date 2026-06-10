import type {Brand, Locale} from '@/lib/types';

function brandShortName(name: string) {
  if (name.toLowerCase() === 'xiaomi') {
    return 'Mi';
  }

  return name.slice(0, 2);
}

export function BrandBar({
  brands,
  activeBrand,
  onSelect,
  locale,
  allLabel
}: {
  brands: Brand[];
  activeBrand: string;
  onSelect: (name: string) => void;
  locale: Locale;
  allLabel: string;
}) {
  const label = (brand: Brand) => (locale === 'ar' ? brand.name_ar : brand.name_en);
  const itemClass = (isActive: boolean) =>
    `group grid w-20 shrink-0 justify-items-center gap-1.5 text-center text-[11px] font-black transition ${
      isActive ? 'text-brand-pink' : 'text-zinc-600 hover:text-brand-pink'
    }`;
  const circleClass = (isActive: boolean) =>
    `grid h-14 w-14 place-items-center rounded-full border-2 text-sm font-black uppercase transition ${
      isActive
        ? 'border-brand-neon bg-brand-neon text-white shadow-sm'
        : 'border-zinc-200 bg-white text-brand-ink group-hover:border-brand-neon'
    }`;

  return (
    <div className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="hide-scrollbar mx-auto flex max-w-7xl gap-3 overflow-x-auto">
        <button className={itemClass(activeBrand === 'all')} onClick={() => onSelect('all')} type="button">
          <span className={circleClass(activeBrand === 'all')} aria-hidden>
            7
          </span>
          <span className="max-w-full truncate">{allLabel}</span>
        </button>
        {brands.map((brand) => (
          <button
            className={itemClass(activeBrand === brand.name_en)}
            key={brand.id}
            onClick={() => onSelect(brand.name_en)}
            type="button"
          >
            <span className={circleClass(activeBrand === brand.name_en)} aria-hidden>
              {brandShortName(brand.name_en)}
            </span>
            <span className="max-w-full truncate">{label(brand)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
