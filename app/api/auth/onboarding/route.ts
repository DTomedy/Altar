import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthWithFallback } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: { onboardingViewed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/auth/onboarding]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
