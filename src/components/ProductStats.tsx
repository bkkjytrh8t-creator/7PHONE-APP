import type {Locale, Product} from '@/lib/types';

export function ProductStats({
  product,
  locale,
  compact = false
}: {
  product: Product;
  locale: Locale;
  compact?: boolean;
}) {
  const items = [
    {icon: '♥', value: product.likes, label: locale === 'ar' ? 'إعجاب' : 'likes'},
    {icon: '◐', value: product.views, label: locale === 'ar' ? 'مشاهدة' : 'views'},
    {icon: '↗', value: product.shares, label: locale === 'ar' ? 'مشاركة' : 'shares'},
    {icon: '✓', value: product.orders, label: locale === 'ar' ? 'طلب' : 'orders'}
  ];

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-zinc-500 ${
        compact ? 'text-[11px]' : 'text-sm'
      }`}
    >
      {items.map((item) => (
        <span className="inline-flex items-center gap-1 font-bold" key={item.label}>
          <span className="text-brand-neon" aria-hidden>{item.icon}</span>
          <span>{item.value}</span>
          {!compact ? <span>{item.label}</span> : null}
        </span>
      ))}
    </div>
  );
}
