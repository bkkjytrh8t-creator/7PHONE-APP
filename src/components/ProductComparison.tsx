import {formatPrice, productName} from '@/lib/format';
import type {Locale, Product} from '@/lib/types';

export function ProductComparison({
  product,
  related,
  locale
}: {
  product: Product;
  related: Product[];
  locale: Locale;
}) {
  const products = [product, ...related.filter((item) => item.id !== product.id).slice(0, 2)];
  const rows = [
    {label: 'السعر', value: (item: Product) => formatPrice(item.price_bhd, locale)},
    {label: 'الشاشة', value: (item: Product) => item.comparison.display},
    {label: 'الكاميرا', value: (item: Product) => item.comparison.camera},
    {label: 'البطارية', value: (item: Product) => item.comparison.battery},
    {label: 'المعالج', value: (item: Product) => item.comparison.processor},
    {label: 'الضمان', value: (item: Product) => item.warranty},
    {label: 'التوفر', value: (item: Product) => item.stock_status === 'available' ? 'متوفر الآن' : 'نفذ من المخزون'}
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white md:p-5">
      <h2 className="text-2xl font-black">مقارنة سريعة</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="rounded-tr-xl bg-black p-3 text-start text-white/60">البند</th>
              {products.map((item, index) => (
                <th className={`${index === products.length - 1 ? 'rounded-tl-xl' : ''} bg-black p-3 text-start`} key={item.id}>
                  {productName(item, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border-t border-white/10 bg-black/50 p-3 font-black text-brand-neon">{row.label}</td>
                {products.map((item) => (
                  <td className="border-t border-white/10 bg-black/50 p-3 font-bold text-white/82" key={item.id}>
                    {row.value(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
