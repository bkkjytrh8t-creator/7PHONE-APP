import {NextResponse} from 'next/server';
import {getAdminAuthStatus, hasAdminSession} from '@/lib/adminAuth';

export async function GET() {
  const authenticated = await hasAdminSession();

  return NextResponse.json({
    authenticated,
    ...getAdminAuthStatus()
  });
}
