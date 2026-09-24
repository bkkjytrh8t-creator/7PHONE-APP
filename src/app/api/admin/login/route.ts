import {NextResponse} from 'next/server';
import {adminSessionCookieOptions, createAdminSessionValue, sessionCookieName, validateAdminCredentials} from '@/lib/adminAuth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    identifier?: string;
    email?: string;
    password?: string;
  } | null;

  const identifier = body?.identifier || body?.email;

  if (!identifier || !body?.password || !validateAdminCredentials(identifier, body.password)) {
    return NextResponse.json({message: 'Invalid admin credentials.'}, {status: 401});
  }

  const response = NextResponse.json({ok: true});
  response.cookies.set(sessionCookieName, createAdminSessionValue(), adminSessionCookieOptions());

  return response;
}
