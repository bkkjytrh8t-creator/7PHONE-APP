import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';
import {defaultLocale, locales} from './src/i18n/routing';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const locale = pathname.startsWith('/en') ? 'en' : 'ar';

  requestHeaders.set('x-sevenphone-locale', locale);

  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.rewrite(url, {request: {headers: requestHeaders}});
  }

  if (pathname === '/buy' || pathname.startsWith('/buy/')) {
    requestHeaders.set('x-sevenphone-locale', request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ar');
    return NextResponse.next({request: {headers: requestHeaders}});
  }

  if (locales.some((item) => pathname === `/${item}` || pathname.startsWith(`/${item}/`))) {
    return NextResponse.next({request: {headers: requestHeaders}});
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/((?!api|_next|.*\\..*).*)']
};
