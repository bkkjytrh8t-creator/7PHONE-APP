import type {Category, Locale} from '@/lib/types';

function CategoryIcon({slug}: {slug: string}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8
  };

  if (slug === 'offers') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <path {...common} d="M4.5 12.5 12.5 4.5l7 7-8 8a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8Z" />
        <path {...common} d="M14.5 7.5h.01" />
        <path {...common} d="m9 15 6-6" />
      </svg>
    );
  }

  if (slug === 'phones') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <rect {...common} x="8" y="3" width="8" height="18" rx="2" />
        <path {...common} d="M10.5 18h3" />
      </svg>
    );
  }

  if (slug === 'tablets') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <rect {...common} x="5" y="4" width="14" height="17" rx="2" />
        <path {...common} d="M10.5 18h3" />
      </svg>
    );
  }

  if (slug === 'watches') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <path {...common} d="M9 3h6l1 4H8l1-4Z" />
        <rect {...common} x="7" y="7" width="10" height="10" rx="3" />
        <path {...common} d="m8 17 1 4h6l1-4" />
        <path {...common} d="M12 10v3l2 1" />
      </svg>
    );
  }

  if (slug === 'audio') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <path {...common} d="M5 13a7 7 0 0 1 14 0" />
        <path {...common} d="M5 13v3a2 2 0 0 0 2 2h1v-6H7a2 2 0 0 0-2 2Z" />
        <path {...common} d="M19 13v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" />
      </svg>
    );
  }

  if (slug === 'laptops') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <rect {...common} x="5" y="5" width="14" height="10" rx="1.5" />
        <path {...common} d="M3.5 18h17" />
        <path {...common} d="M9 15h6" />
      </svg>
    );
  }

  if (slug === 'gaming') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
        <path {...common} d="M8 10h-1.5a4 4 0 0 0-3.8 2.7l-.7 2.2a2.5 2.5 0 0 0 4.3 2.4L8 15h8l1.7 2.3a2.5 2.5 0 0 0 4.3-2.4l-.7-2.2a4 4 0 0 0-3.8-2.7H16" />
        <path {...common} d="M8 13h3" />
        <path {...common} d="M9.5 11.5v3" />
        <path {...common} d="M16.5 12.5h.01" />
        <path {...common} d="M18.5 14.5h.01" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
      <path {...common} d="M5 5h7v7H5z" />
      <path {...common} d="M14 5h5v5h-5z" />
      <path {...common} d="M14 12h5v7h-5z" />
      <path {...common} d="M5 14h7v5H5z" />
    </svg>
  );
}

export function CategoryBar({
  categories,
  activeCategory,
  onSelect,
  locale,
  allLabel
}: {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
  locale: Locale;
  allLabel: string;
}) {
  const label = (category: Category) => (locale === 'ar' ? category.name_ar : category.name_en);
  const itemClass = (isActive: boolean) =>
    `group grid w-24 shrink-0 justify-items-center gap-2 text-center text-xs font-black transition ${
      isActive ? 'text-brand-pink' : 'text-zinc-600 hover:text-brand-pink'
    }`;
  const circleClass = (isActive: boolean) =>
    `grid h-[72px] w-[72px] place-items-center rounded-full border-[2.5px] transition ${
      isActive
        ? 'border-brand-neon bg-brand-neon text-white shadow-sm'
        : 'border-zinc-200 bg-white text-brand-ink group-hover:border-brand-neon'
    }`;

  return (
    <div className="sticky top-[99px] z-30 border-b border-zinc-200 bg-white/96 px-4 py-4 backdrop-blur">
      <div className="hide-scrollbar mx-auto flex max-w-7xl gap-3 overflow-x-auto">
        <button
          className={itemClass(activeCategory === 'all')}
          onClick={() => onSelect('all')}
          type="button"
        >
          <span className={circleClass(activeCategory === 'all')} aria-hidden>
            <CategoryIcon slug="all" />
          </span>
          <span className="max-w-full truncate">{allLabel}</span>
        </button>
        {categories.map((category) => (
          <button
            className={itemClass(activeCategory === category.slug)}
            key={category.id}
            onClick={() => onSelect(category.slug)}
            type="button"
          >
            <span className={circleClass(activeCategory === category.slug)} aria-hidden>
              <CategoryIcon slug={category.slug} />
            </span>
            <span className="max-w-full truncate">{label(category)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
