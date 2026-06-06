import { NextRequest, NextResponse } from 'next/server';

function verifyTokenSimple(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.userId || !payload.email) return false;
    const exp = payload.exp;
    if (exp && Date.now() >= exp * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

const PROTECTED_PATHS = ['/dashboard', '/wallet', '/settings', '/campaigns/new'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get('altar_token')?.value;
  if (!token || !verifyTokenSimple(token)) {
    const loginUrl = new URL('/auth', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/wallet/:path*', '/settings/:path*', '/campaigns/new'],
};
