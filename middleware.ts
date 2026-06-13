import { NextRequest, NextResponse } from "next/server";

function parseToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.userId || !payload.email) return null;
    const exp = payload.exp;
    if (exp && Date.now() >= exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

const PROTECTED_PATHS = [
  "/dashboard",
  "/wallet",
  "/settings",
  "/campaigns/new",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get("altar_token")?.value;
  const payload = token ? parseToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/auth", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!payload.emailVerified) {
    const verifyUrl = new URL("/auth", req.url);
    verifyUrl.searchParams.set("mode", "login");
    verifyUrl.searchParams.set("error", "verify_email");
    return NextResponse.redirect(verifyUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallet/:path*",
    "/settings/:path*",
    "/campaigns/new",
  ],
};
