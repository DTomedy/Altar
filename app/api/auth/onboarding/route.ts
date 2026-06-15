import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, userRepository } from '@/lib/services';

export async function POST(req: NextRequest) {
  try {
    const user = await authService.verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    await userRepository.update(user.userId, { onboardingViewed: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/onboarding]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
