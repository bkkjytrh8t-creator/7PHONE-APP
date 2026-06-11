import {redirect} from 'next/navigation';
import {hasAdminSession} from '@/lib/adminAuth';

export default async function AdminProductsShortcutPage() {
  const isAllowed = await hasAdminSession();
  redirect(isAllowed ? '/ar/admin/products' : '/ar/admin/login');
}
