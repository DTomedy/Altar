import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, userRepository } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const user = await authService.verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const dbUser = await userRepository.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('[GET /api/auth/me]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
