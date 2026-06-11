import {NextResponse} from 'next/server';
import {setAdminSessionCookie, validateAdminCredentials} from '@/lib/adminAuth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body.password || !validateAdminCredentials(body.email, body.password)) {
    return NextResponse.json({message: 'Invalid admin credentials.'}, {status: 401});
  }

  await setAdminSessionCookie();

  return NextResponse.json({ok: true});
}
