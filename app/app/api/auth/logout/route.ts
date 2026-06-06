import 'server-only';

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set('altar_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('[POST /api/auth/logout]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
