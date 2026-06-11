import {redirect} from 'next/navigation';
import {hasAdminSession} from '@/lib/adminAuth';

export default async function AdminShortcutPage() {
  const isAllowed = await hasAdminSession();
  redirect(isAllowed ? '/ar/admin' : '/ar/admin/login');
}
