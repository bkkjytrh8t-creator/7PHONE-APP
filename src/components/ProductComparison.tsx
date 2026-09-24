import {formatPrice, localizedProductText, productName} from '@/lib/format';
import {productAvailabilityLabel} from '@/lib/stock';
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
  const text = {
    title: locale === 'ar' ? 'مقارنة سريعة' : 'Quick comparison',
    item: locale === 'ar' ? 'البند' : 'Item',
    price: locale === 'ar' ? 'السعر' : 'Price',
    display: locale === 'ar' ? 'الشاشة' : 'Display',
    camera: locale === 'ar' ? 'الكاميرا' : 'Camera',
    battery: locale === 'ar' ? 'البطارية' : 'Battery',
    processor: locale === 'ar' ? 'المعالج' : 'Processor',
    warranty: locale === 'ar' ? 'الضمان' : 'Warranty',
    availability: locale === 'ar' ? 'التوفر' : 'Availability',
    available: locale === 'ar' ? 'متوفر' : 'Available',
    out: locale === 'ar' ? 'غير متوفر' : 'Out of stock'
  };
  const rows = [
    {label: text.price, value: (item: Product) => formatPrice(item.price_bhd, locale)},
    {label: text.display, value: (item: Product) => localizedProductText(item, 'comparison_display', locale, item.comparison.display)},
    {label: text.camera, value: (item: Product) => localizedProductText(item, 'comparison_camera', locale, item.comparison.camera)},
    {label: text.battery, value: (item: Product) => localizedProductText(item, 'comparison_battery', locale, item.comparison.battery)},
    {label: text.processor, value: (item: Product) => localizedProductText(item, 'comparison_processor', locale, item.comparison.processor)},
    {label: text.warranty, value: (item: Product) => localizedProductText(item, 'warranty', locale)},
    {label: text.availability, value: (item: Product) => productAvailabilityLabel(item, locale)}
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white md:p-5">
      <h2 className="text-2xl font-black">{text.title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="rounded-tr-xl bg-black p-3 text-start text-white/60">{text.item}</th>
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
