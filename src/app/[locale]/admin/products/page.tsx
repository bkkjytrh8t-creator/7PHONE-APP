import {AdminAuthGate} from '@/components/AdminAuthGate';
import {AdminProductManager} from '@/components/AdminProductManager';
import {getProducts} from '@/lib/data';
import {brands, categories} from '@/lib/seed';
import type {Locale} from '@/lib/types';

export default async function AdminProductsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale: localeParam} = await params;
  const locale = localeParam as Locale;
  const products = await getProducts();

  return (
    <AdminAuthGate locale={locale}>
      <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-6xl rounded-[20px] bg-white p-6 shadow-neon">
        <h1 className="text-3xl font-black">Products</h1>
        <p className="mt-2 text-zinc-600">
          {locale === 'ar'
            ? 'أدخل المنتج والسعر والصورة. هذه نسخة سهلة للتجربة تحفظ على نفس المتصفح.'
            : 'Enter product, price, and image. This easy preview saves in this browser.'}
        </p>
        <AdminProductManager
          locale={locale}
          seedProducts={products}
          categories={categories}
          brands={brands}
        />
      </div>
      </main>
    </AdminAuthGate>
  );
}
