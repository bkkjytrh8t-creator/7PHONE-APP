import Link from 'next/link';
import type {Locale, Product, StoreSettings} from '@/lib/types';

const content = {
  en: {
    overview: 'Dashboard',
    manage: 'Manage',
    products: 'Products',
    categories: 'Categories',
    offers: 'Offers',
    orders: 'Orders / WhatsApp Requests',
    payment: 'Payment Settings',
    delivery: 'Delivery Settings',
    content: 'Website Content',
    settings: 'Settings',
    active: 'Active products',
    requests: 'WhatsApp requests',
    revenue: 'Listed value',
    temporary: 'Temporary tools are ready for controlled editing. Connect Supabase for permanent multi-device saving.'
  },
  ar: {
    overview: 'لوحة التحكم',
    manage: 'إدارة',
    products: 'المنتجات',
    categories: 'التصنيفات',
    offers: 'العروض',
    orders: 'الطلبات / واتساب',
    payment: 'إعدادات الدفع',
    delivery: 'إعدادات التوصيل',
    content: 'محتوى الموقع',
    settings: 'الإعدادات',
    active: 'منتجات ظاهرة',
    requests: 'طلبات واتساب',
    revenue: 'قيمة المنتجات',
    temporary: 'الأدوات المؤقتة جاهزة للتعديل المنظم. اربط Supabase للحفظ الدائم على كل الأجهزة.'
  }
};

export function AdminDashboard({
  locale,
  products,
  settings
}: {
  locale: Locale;
  products: Product[];
  settings: StoreSettings;
}) {
  const copy = content[locale];
  const activeProducts = products.filter((product) => product.is_active);
  const totalOrders = products.reduce((sum, product) => sum + product.orders, 0);
  const totalValue = products.reduce((sum, product) => sum + product.price_bhd, 0);
  const sections = [
    [copy.products, `/${locale}/admin/products`, locale === 'ar' ? 'إضافة وتعديل وحذف المنتجات والأسعار والصور.' : 'Add, edit, delete products, prices, and images.'],
    [copy.categories, `/${locale}/admin/categories`, locale === 'ar' ? 'إدارة التصنيفات وترتيب ظهورها.' : 'Manage categories and display order.'],
    [copy.offers, `/${locale}/admin/products`, locale === 'ar' ? 'تفعيل العروض والمنتجات المميزة.' : 'Control offers and featured products.'],
    [copy.orders, `/${locale}/admin/settings`, locale === 'ar' ? 'تجهيز قالب رسائل واتساب للطلبات.' : 'Prepare WhatsApp request templates.'],
    [copy.payment, `/${locale}/admin/settings`, locale === 'ar' ? 'BenefitPay و IBAN وخيارات الدفع.' : 'BenefitPay, IBAN, and payment options.'],
    [copy.delivery, `/${locale}/admin/settings`, locale === 'ar' ? 'خيارات التوصيل والاستلام.' : 'Delivery and pickup options.'],
    [copy.content, `/${locale}/admin/settings`, locale === 'ar' ? 'محتوى الموقع والرسائل العامة.' : 'Website content and store messages.'],
    [copy.settings, `/${locale}/admin/settings`, locale === 'ar' ? 'إعدادات التواصل والواتساب.' : 'Contact and WhatsApp settings.']
  ];

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{copy.overview}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-400">{copy.temporary}</p>
          </div>
          <a className="text-sm font-black text-brand-neon" href={`https://wa.me/${settings.whatsapp}`}>
            WhatsApp {settings.whatsapp}
          </a>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            [copy.active, activeProducts.length],
            [copy.requests, totalOrders],
            [copy.revenue, `BHD ${totalValue.toFixed(3)}`]
          ].map(([label, value]) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4" key={label}>
              <div className="text-xs font-black uppercase text-zinc-500">{label}</div>
              <div className="mt-2 text-2xl font-black text-white">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sections.map(([title, href, description]) => (
          <Link
            className="rounded-lg border border-white/10 bg-zinc-950 p-4 transition hover:border-brand-neon hover:bg-zinc-900"
            href={href}
            key={title}
          >
            <span className="text-xs font-black uppercase tracking-[0.14em] text-brand-neon">{copy.manage}</span>
            <h3 className="mt-2 text-lg font-black text-white">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
