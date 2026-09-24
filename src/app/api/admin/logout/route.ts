import {NextResponse} from 'next/server';
import {adminSessionCookieOptions, sessionCookieName} from '@/lib/adminAuth';

export async function POST() {
  const response = NextResponse.json({ok: true});
  response.cookies.set(sessionCookieName, '', {...adminSessionCookieOptions(), maxAge: 0});

  return response;
}
